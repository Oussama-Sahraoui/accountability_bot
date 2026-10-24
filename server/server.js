require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { Client, EmbedBuilder, GatewayIntentBits, REST, Routes, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const app = express();

app.use(express.json());
app.use(cors());

// MySQL connection placeholder
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Temporary storage for multi-step ping time selection
const pendingPingTimes = new Map();

app.get("/fetch_test_msg", (req, res) => {
  res.send("hi");
});

app.post("/post_test_msg", (req, res) => {
  console.log(req.body.test_msg);
});

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// discord code section below:
// --------------------------
// discord var init section
// --------------------------
const serverid = process.env.SERVER_ID;
const allTimezones = Intl.supportedValuesOf('timeZone');

const commands = [
  {
    name: 'create_ping',
    description: 'Create an accountability ping, to tag you in a specific time and channel',
    options: [
      {
        name: 'name',
        type: 3, // STRING
        description: 'Name of the habit',
        required: true,
      },
      {
        name: 'target_channel',
        type: 7, // CHANNEL
        description: 'The channel where pings will be sent',
        required: true,
      },
      {
        name: 'msg',
        type: 3,
        description: 'Message the bot should send',
        required: false,
      },
      {
        name: 'partner',
        type: 6, // USER
        description: 'Your accountability partner to be pinged in case of failure',
        required: false,
      }
    ]
  },
  {
    name: 'set_time_zone',
    description: 'Set your local timezone',
    options: [
      {
        name: 'timezone',
        type: 3, // STRING
        description: 'Type your region/city (e.g., Algiers, New York, Paris)',
        required: true,
        autocomplete: true
      }
    ]
  },
  {
    name: 'add_ping_time',
    description: 'Add a time for a given ping with multi-day selection',
    options:[
      {
        name: 'ping_id',
        type: 3, // string
        description: 'The ID of the parent ping',
        required: true
      },
      {
        name: 'time',
        type: 3, // String
        description: 'Time in 24-hour format (e.g., 17:00)',
        required: true
      },
      {
        name: 'msg',
        type: 3,
        description: 'Optional custom message override',
        required: false,
      },
      {
        name: 'partner',
        type: 6, // USER
        description: 'Optional partner override',
        required: false,
      }
    ]
  },
  {
    name: "view_pings",
    description: "view your currently active pings",
  },
  {
    name: "view_ping_times",
    description: "view your currently active times, associated with a ping",
    options:[
      {
       name: "ping_id",
       description: "ping_id of the ping who's times you'd like to view",
       type: 3,
       required: true
      }
    ]
  },
  {
    name: "help",
    description: "gives a list of commands a usage guide"
  }
];

// Helper: Convert local weekday + time in a specific IANA timezone to UTC Date
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function convertLocalToUtc(weekdayName, timeStr, timezone) {
    const dayIndex = weekdays.indexOf(weekdayName);
    const base = new Date(Date.UTC(2026, 0, 4 + dayIndex));
    const [hour, minute] = timeStr.split(':').map(Number);

    const localYear = base.getUTCFullYear();
    const localMonth = base.getUTCMonth();
    const localDay = base.getUTCDate();

    const guess = new Date(Date.UTC(localYear, localMonth, localDay, hour, minute, 0));
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(guess);
    const getPart = (type) => parseInt(parts.find(p => p.type === type).value, 10);

    const gYear = getPart('year');
    const gMonth = getPart('month') - 1;
    const gDay = getPart('day');
    const gHour = getPart('hour') % 24;
    const gMinute = getPart('minute');

    const simulatedLocalMillis = Date.UTC(gYear, gMonth, gDay, gHour, gMinute, 0);
    const targetLocalMillis = Date.UTC(localYear, localMonth, localDay, hour, minute, 0);
    const diff = simulatedLocalMillis - targetLocalMillis;

    return new Date(guess.getTime() - diff);
}

client.once('ready', async () => {
  console.log(`Discord Bot logged in as ${client.user.tag}!`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.SERVER_ID),
      { body: commands },
    );
    console.log('Commands successfully registered');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

// Listen for interactions (Autocomplete, Slash Commands, and Select Menus)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'set_time_zone') {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const filtered = allTimezones
        .filter(tz => tz.toLowerCase().includes(focusedValue))
        .slice(0, 25);

      await interaction.respond(
        filtered.map(tz => ({ name: tz, value: tz }))
      );
    }
    return;
  }

  // Handle Select Menu submission for multi-day ping times
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_ping_days') {
    const ownerId = interaction.user.id;
    const pendingData = pendingPingTimes.get(ownerId);

    if (!pendingData) {
      return interaction.update({ content: '❌ Session expired. Please run `/add_ping_time` again.', components: [] });
    }

    let selectedDays = interaction.values;
    if (selectedDays.includes('everyday')) {
      selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    const timezoneQuery = `SELECT timezone FROM users WHERE user_id = ?`;
    db.query(timezoneQuery, [ownerId], async (err, results) => {
      if (err || results.length === 0 || !results[0].timezone) {
        return await interaction.update({
          content: `❌ You must set your timezone using \`/set_time_zone\` before adding ping times!`,
          components: [],
        });
      }

      const userTimezone = results[0].timezone;

      for (const day of selectedDays) {
        const utcDate = convertLocalToUtc(day, pendingData.time, userTimezone);
        const utcDay = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(utcDate);
        const utcTime = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(utcDate);

        const insertSql = `
          INSERT INTO ping_times 
            (parent_ping_id, pinged_partner_id, message, day, time, ping_utc_day, ping_utc_time)
          VALUES 
            (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(insertSql, [
          pendingData.ping_id, 
          pendingData.partner ? pendingData.partner.id : null, 
          pendingData.msg, 
          day, 
          pendingData.time, 
          utcDay, 
          utcTime
        ], (err, result) => {
          if (err) { console.log(err); } else { console.log(`Ping time added for ${day}!`); }
        });
      }

      pendingPingTimes.delete(ownerId);

      await interaction.update({
        content: `🎉 Successfully created ping times for **${selectedDays.join(', ')}** at **${pendingData.time}** (${userTimezone})!`,
        components: [],
      });
    });
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'view_ping_times') {
    const ping_Id = interaction.options.getString('ping_id');
    const sql = `
      SELECT 
        pt.ping_time_id,
        pt.time,
        pt.day,
        COALESCE(pt.pinged_partner_id, p.pinged_partner_id) AS pinged_partner_id,
        COALESCE(pt.message, p.message) AS message
      FROM ping_times pt
      JOIN pings p ON pt.parent_ping_id = p.ping_id
      WHERE pt.parent_ping_id = ?
    `;
    db.query(sql, [ping_Id], async (err, res) => {
      if (err) {
        console.log(err);
        return interaction.reply({ content: 'Error fetching pings.', ephemeral: true });
      }

      if (!res || res.length === 0) {
        return interaction.reply({ content: 'You have no active ping times.', ephemeral: true });
      }

      const timeEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Your Active Pings')
        .setDescription('Here are all your scheduled pings:')
        .addFields(
          res.map(row => ({
            name: 'ping time',
            value: `**ID:** \`${row.ping_time_id}\`\n` +
                   `**Time:** ${row.time}\n` +
                   `**Day:** ${row.day}\n` +
                   `**Partner:** ${row.pinged_partner_id ? `<@${row.pinged_partner_id}>` : 'None'}\n` +
                   `**Message:** ${row.message || 'None'}`
          }))
        )
        .setFooter({ text: 'View time overview' });

      await interaction.reply({ embeds: [timeEmbed] });
    });
  }

  if (interaction.commandName === 'view_pings') {
    const ownerId = interaction.user.id;
    const sql = `
      SELECT ping_id, ping_name, target_channel, pinged_partner_id, message 
      FROM pings 
      WHERE user_id = ?
    `;
    db.query(sql, [ownerId], async (err, res) => {
      if (err) {
        console.log(err);
        return interaction.reply({ content: 'Error fetching pings.', ephemeral: true });
      }

      if (!res || res.length === 0) {
        return interaction.reply({ content: 'You have no active pings.', ephemeral: true });
      }

      const viewEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Your Active Pings')
        .setDescription('Here are all your scheduled pings:')
        .addFields(
          res.map(row => ({
            name: "name: " + row.ping_name || 'Ping',
            value: `**ID:** \`${row.ping_id}\`\n` +
                   `**Channel:** <#${row.target_channel}>\n` +
                   `**Partner:** ${row.pinged_partner_id ? `<@${row.pinged_partner_id}>` : 'None'}\n` +
                   `**Message:** ${row.message || 'None'}`
          }))
        )
        .setFooter({ text: 'Ping Overview' });

      await interaction.reply({ embeds: [viewEmbed] });
    });
  }

  if (interaction.commandName === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Command List')
      .setDescription('Here are all the available commands:')
      .addFields(
        commands.map(cmd => ({
          name: cmd.name,
          value: cmd.description
        }))
      )
      .setFooter({ text: 'Usage Guide' });
    await interaction.reply({ embeds: [helpEmbed] });
  }

  if (interaction.commandName === 'create_ping') {
    const ownerId = interaction.user.id;
    const ping_name = interaction.options.getString('name');
    const channel = interaction.options.getChannel('target_channel');
    const msg = interaction.options.getString('msg');
    const partner = interaction.options.getUser('partner');
    const score = 0;
    
    await interaction.reply(`Ping created for <@${ownerId}> in <#${channel.id}>!`);
    const sql = `
      INSERT INTO pings 
        (user_id, ping_name, target_channel, pinged_partner_id, message, score) 
      VALUES 
        (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [ownerId, ping_name, channel.id, partner ? partner.id : null, msg, score], (err, result) => {
      if (err) { console.log(err); } else { console.log("Ping created successfully!"); }
    });
  }

  if (interaction.commandName === 'set_time_zone') {
    const chosenTimezone = interaction.options.getString('timezone');
    const ownerId = interaction.user.id;

    if (!allTimezones.includes(chosenTimezone)) {
      return await interaction.reply({
        content: `\`${chosenTimezone}\` is not a valid IANA timezone. Please select one from the suggestion list.`,
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `Your timezone has been set to **${chosenTimezone}**!`,
      ephemeral: true
    });
    
    const sql = "INSERT INTO users (user_id, timezone) VALUES (?, ?) ON DUPLICATE KEY UPDATE timezone = VALUES(timezone)";
    db.query(sql, [ownerId, chosenTimezone], (err, result) => {
      if (err) console.log(err);
    });
  }

  if (interaction.commandName === 'add_ping_time') {
    const ownerId = interaction.user.id;
    const ping_id = interaction.options.getString('ping_id');
    const msg = interaction.options.getString('msg');
    const partner = interaction.options.getUser('partner');
    const time = interaction.options.getString('time');

    pendingPingTimes.set(ownerId, { ping_id, time, msg, partner });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_ping_days')
      .setPlaceholder('Select days for this ping time...')
      .setMinValues(1)
      .setMaxValues(8)
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Everyday (All 7 Days)').setValue('everyday'),
        new StringSelectMenuOptionBuilder().setLabel('Monday').setValue('Monday'),
        new StringSelectMenuOptionBuilder().setLabel('Tuesday').setValue('Tuesday'),
        new StringSelectMenuOptionBuilder().setLabel('Wednesday').setValue('Wednesday'),
        new StringSelectMenuOptionBuilder().setLabel('Thursday').setValue('Thursday'),
        new StringSelectMenuOptionBuilder().setLabel('Friday').setValue('Friday'),
        new StringSelectMenuOptionBuilder().setLabel('Saturday').setValue('Saturday'),
        new StringSelectMenuOptionBuilder().setLabel('Sunday').setValue('Sunday')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: `Time (**${time}**) locked in! Now, select which day(s) this ping should run on:`,
      components: [row],
      ephemeral: true
    });
  }
});

async function checkAndSendPings() {
    console.log("[Scheduler] Tick: Running checkAndSendPings...");

    const sql = `
        SELECT 
            pt.ping_time_id,
            pt.day,
            pt.time,
            COALESCE(pt.message, p.message) AS final_msg,
            COALESCE(pt.pinged_partner_id, p.pinged_partner_id) AS final_partner,
            p.target_channel,
            p.user_id
        FROM ping_times pt
        JOIN pings p ON pt.parent_ping_id = p.ping_id
        WHERE pt.ping_utc_day = DAYNAME(UTC_TIMESTAMP())
          AND pt.ping_utc_time = TIME_FORMAT(UTC_TIMESTAMP(), '%H:%i:00')
    `;

    db.query(sql, async (err, results) => {
        if (err) {
            console.error("[Scheduler] ❌ SQL Error fetching pings:", err);
            return;
        }

        console.log(`[Scheduler] 📊 Query matched ${results.length} ping(s) for the current UTC minute.`);

        for (const row of results) {
            try {
                console.log(`[Scheduler] ✅ MATCH FOUND! Attempting to send ping for user ${row.user_id}...`);
                
                const channel = await client.channels.fetch(row.target_channel);
                if (!channel) {
                    console.log(`[Scheduler] ❌ Error: Could not find channel ID ${row.target_channel}`);
                    continue;
                }

                let pingContent = `<@${row.user_id}> Time for your habit!`;
                
                if (row.final_partner) {
                    pingContent += ` (Partner: <@${row.final_partner}>)`;
                }

                if (row.final_msg) {
                    pingContent += `\n> ${row.final_msg}`;
                }

                await channel.send(pingContent);
                console.log(`[Scheduler] 🎉 Successfully sent ping message!`);
            } catch (innerErr) {
                console.error(`[Scheduler] ❌ Failed to process row ${row.ping_time_id}:`, innerErr);
            }
        }
    });
}

setInterval(async () => {
    checkAndSendPings();
    console.log("minute check");
}, 60 * 1000);

client.login(process.env.DISCORD_TOKEN);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});