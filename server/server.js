require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { Client, EmbedBuilder, GatewayIntentBits, REST, Routes, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const app = express();

app.use(express.json());
app.use(cors());


if (process.env.BOT_ENABLED !== 'true') {
    console.log('🛑 Bot is disabled via environment flag. Standing by...');
    
    // Keeps Render's web service wrapper happy and alive
    setInterval(() => {
        // Idling...
    }, 60 * 60 * 1000);
    
    return; // Skip the rest of the bot startup logic
}
// MySQL connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false 
    }
});

// Temporary storage for multi-step ping time selection
const pendingPingTimes = new Map();

app.get("/fetch_test_msg", (req, res) => {
  res.send("hi");
});

app.post("/post_test_msg", (req, res) => {
  console.log(req.body.test_msg);
});

app.get('/', (req, res) => {
  res.send('Accountability Bot is running!');
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
        channel_types: [0]
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
    name:'update_ping',
    description:"Allows you to update/modify information about a given ping",
    options:[{
      name:"ping_id",
      description:"ping_id of the ping you seek to modify",
      type: 3,
      required:true
    },
    {
        name: 'target_channel',
        type: 7, // CHANNEL
        description: 'The channel where pings will be sent',
        required: false,
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
      },
      {
        name: 'name',
        type: 3, // STRING
        description: 'Name of the habit',
        required: false,
      },
      
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
  },
  {
    name:"delete_ping",
    description:'deletes ping',
    options:[
      {
        name:'ping_id',
        description:'id of ping to be deleted',
        type:3,
        required:true
      }
    ]
  },
  {
    name:"delete_ping_time",
    description:'deletes ping_time',
    options:[
      {

        name:'ping_time_id',
        description:'id of ping_time to be deleted',
        type:3,
        required:true
      }
    ]
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

if (!interaction.isChatInputCommand()) return;

  // 🛡️ Global Timezone Middleware Guard
  const EXEMPT_COMMANDS = ['set_time_zone', 'help'];
  if (!EXEMPT_COMMANDS.includes(interaction.commandName)) {
    const ownerId = interaction.user.id;
    try {
      const [userRows] = await db.query('SELECT timezone FROM users WHERE user_id = ?', [ownerId]);
      
      if (!userRows || userRows.length === 0 || !userRows[0].timezone) {
        return await interaction.reply({
          content: "⚠️ **Setup Required:** You must configure your timezone using `/set_time_zone` at least once before using this bot!",
          ephemeral: true
        });
      }
    } catch (err) {
      console.error("[Middleware] Error checking timezone:", err);
      return await interaction.reply({
        content: "❌ An error occurred while verifying your account setup.",
        ephemeral: true
      });
    }
  }

  // --- Your regular command handlers continue below ---



  if (interaction.commandName==='update_ping'){
        const ownerId = interaction.user.id;
        const ping_name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('target_channel');
        const msg = interaction.options.getString('msg');
        const partner = interaction.options.getUser('partner');
        const ping_id = interaction.options.getString('ping_id');

        const sql=`
        UPDATE pings
        SET
        ping_name = COALESCE(?, ping_name  ),
        target_channel = COALESCE(?, target_channel ) ,
        pinged_partner_id = COALESCE(?,  pinged_partner_id),
        message = COALESCE(?, message )
        WHERE ping_id= ? AND user_id= ?
        `

      try{
        const [result]= await db.query(sql,[ping_name ? ping_name: null,channel? channel.id : null,partner ? partner.id : null,msg? msg : null,ping_id,ownerId])
          await interaction.reply(`Ping updated for <@${ownerId}> ID is \`${ping_id}\`!`)
          console.log("success")
      }
      catch(err){
console.log(err)
      }
  }



  // Handle Select Menu submission for multi-day ping times
// Handle Select Menu submission for multi-day ping times
if (interaction.isStringSelectMenu() && interaction.customId === 'select_ping_days') {
    const ownerId = interaction.user.id;
    const pendingData = pendingPingTimes.get(ownerId);
    const successes = [];
const duplicates = [];

    if (!pendingData) {
        return interaction.update({ content: '❌ Session expired. Please run `/add_ping_time` again.', components: [] });
    }

    let selectedDays = interaction.values;
    if (selectedDays.includes('everyday')) {
        selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    try {
        // 1. Fetch user timezone using promise destructuring
        const timezoneQuery = 'SELECT timezone FROM users WHERE user_id = ?';
        const [timezoneResults] = await db.query(timezoneQuery, [ownerId]);

        if (!timezoneResults || timezoneResults.length === 0 || !timezoneResults[0].timezone) {
            return await interaction.update({
                content: '❌ You must set your timezone using `/set_timezone` before adding ping times!',
                components: [],
            });
        }

        const userTimezone = timezoneResults[0].timezone;

        // 2. Loop through days and insert sequentially with `await`
        const insertSql = `
            INSERT INTO ping_times 
            (parent_ping_id, pinged_partner_id, message, day, time, ping_utc_day, ping_utc_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const day of selectedDays) {
            const utcDate = convertLocalToUtc(day, pendingData.time, userTimezone);
            const utcDay = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(utcDate);
            const utcTime = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(utcDate);
 try {
            await db.query(insertSql, [
                pendingData.ping_id,
                pendingData.partner ? pendingData.partner.id : null,
                pendingData.msg,
                day,
                pendingData.time,
                utcDay,
                utcTime
            ]);
            successes.push(day);
            console.log(`Ping time added for ${day}`); }
            catch(err){
              if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
            duplicates.push(day);
        } else {
            console.log(err); 
        }
            }
        }

        // 3. Clean up and send success message after everything finishes
        pendingPingTimes.delete(ownerId);

// Build a granular response message
let replyContent = '';
if (successes.length > 0) {
    replyContent += `✅ Successfully created ping times for **${successes.join(', ')}** at **${pendingData.time}** (${userTimezone})!\n`;
}
if (duplicates.length > 0) {
    replyContent += `⚠️ Skipped the following days (already booked): **${duplicates.join(', ')}**`;
}

await interaction.update({
    content: replyContent,
    components: [],
});

    } catch (err) {
    console.log(err);
    
    if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
        await interaction.update({
            content: ' You already have a ping scheduled for this exact time slot!',
            components: [],
        });
    } else {
        await interaction.update({
            content: ' Failed to create ping times in the database.',
            components: [],
        });
    }
}
    return;
}

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'view_ping_times') {
    const ping_Id = interaction.options.getString('ping_id');
    const ownerId = interaction.user.id;
    



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
      AND p.user_id = ? 
    `;
   try {
    // 1. Destructure the returned rows array from the query promise
    const [result] = await db.query(sql, [ping_Id,ownerId]);

    // 2. Check if no rows were returned
    if (!result || result.length === 0) {
        return interaction.reply({ content: 'You have no active ping times.', ephemeral: true });
    }

    // 3. Build the embed, mapping over `result` instead of `res`
    const timeEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Your Active Pings')
        .setDescription('Here are all your scheduled pings:')
        .addFields(
            result.map(row => ({
                name: 'ping time',
                value: `**ID:** \`${row.ping_time_id}\`\n` +
                       `**Time:** ${row.time}\n` +
                       `**Day:** ${row.day}\n` +
                       `**Partner:** ${row.pinged_partner_id ? `<@${row.pinged_partner_id}>` : 'None'}\n` +
                       `**Message:** ${row.message || 'None'}`
            }))
        )
        .setFooter({ text: 'View time overview' });

    // 4. Send the response back to Discord
    await interaction.reply({ embeds: [timeEmbed] });

} catch (err) {
    console.log(err);
    return interaction.reply({ content: 'Error fetching pings.', ephemeral: true });
}
  }

  if (interaction.commandName === 'view_pings') {
    const ownerId = interaction.user.id;
    const sql = `
      SELECT ping_id, ping_name, target_channel, pinged_partner_id, message 
      FROM pings 
      WHERE user_id = ?
    `;
  try {
   const [result] = await db.query(sql, [ownerId])
     

      if (!result || result.length === 0) {
        return interaction.reply({ content: 'You have no active pings.', ephemeral: true });
      }

      const viewEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Your Active Pings')
        .setDescription('Here are all your scheduled pings:')
        .addFields(
          result.map(row => ({
            name: "name: " + row.ping_name || 'Ping',
            value: `**ID:** \`${row.ping_id}\`\n` +
                   `**Channel:** <#${row.target_channel}>\n` +
                   `**Partner:** ${row.pinged_partner_id ? `<@${row.pinged_partner_id}>` : 'None'}\n` +
                   `**Message:** ${row.message || 'None'}`
          }))
        )
        .setFooter({ text: 'Ping Overview' });

      await interaction.reply({ embeds: [viewEmbed] });
      }
     catch (err) {
        console.log(err);
        return interaction.reply({ content: 'Error fetching pings.', ephemeral: true });
      }
  }

  if (interaction.commandName === 'delete_ping') {
    const ownerId= interaction.user.id;
    const ping_id = interaction.options.getString('ping_id');
    const sql=`
    DELETE FROM pings
    where ping_id= ? AND user_id= ? 
    `
    try {
      const [result] = await db.query(sql,[ping_id,ownerId])
      await interaction.reply(`Ping deleted for <@${ownerId}> ID <${ping_id}>!`)
    } catch(err){
      console.log(err)
    }
  }
  
  if (interaction.commandName === 'delete_ping_time'){
    const ownerId= interaction.user.id;
   
    const ping_time_id = interaction.options.getString('ping_time_id');
    const sql = `
    DELETE pt 
    FROM ping_times pt
    JOIN pings p ON pt.parent_ping_id = p.ping_id
    WHERE pt.ping_time_id = ? 
 
      AND p.user_id = ?
`;
    try {
    const [result] = await db.query(sql, [ping_time_id, ownerId]);

    if (result.affectedRows === 0) {
        return await interaction.reply({ 
            content: " Could not delete ping time. Check if the IDs are correct and you own this ping.", 
            ephemeral: true 
        });
    }

    await interaction.reply(`Ping time deleted for <@${ownerId}> ID <${ping_time_id}>!`);
} catch (err) {
    console.log(err);
    await interaction.reply({ content: "❌ Error deleting ping time.", ephemeral: true });
}
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
    
    const sql = `
      INSERT INTO pings 
        (user_id, ping_name, target_channel, pinged_partner_id, message, score) 
      VALUES 
        (?, ?, ?, ?, ?, ?)
    `;
    try {
     const [result] = await db.query(sql, [ownerId, ping_name, channel.id, partner ? partner.id : null, msg, score])
    const  sql2 = `
      SELECT ping_id FROM pings 
       WHERE user_id = ? AND
       ping_name <=>   ? AND
       target_channel = ? AND
       pinged_partner_id <=> ? AND 
       message <=> ? AND
       score <=> ? 
    `;
     const  [result2] = await db.query(sql2 , [ownerId, ping_name, channel.id, partner ? partner.id : null, msg, score])

     
    console.log("Ping created successfully!"); 
await interaction.reply({ 
    content: `Ping created for <@${ownerId}> in <#${channel.id}>! with ID <${result2[0].ping_id}>`, 
    ephemeral: true 
});    }
    catch (err){
        
        await interaction.reply({ content: "❌ Failed to create ping in database.", ephemeral: true });
        console.log(err)
      }
 
  
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
    
    
    try {
   const [result]= await db.query(sql, [ownerId, chosenTimezone]) }
      
      catch(err){  console.log(err);}
    
    
  }

  if (interaction.commandName === 'add_ping_time') {
    const ownerId = interaction.user.id;
    const ping_id = interaction.options.getString('ping_id');
    const msg = interaction.options.getString('msg');
    const partner = interaction.options.getUser('partner');
    const time = interaction.options.getString('time');


    const sql=`
    SELECT * FROM pings
    WHERE ping_id= ?
    AND user_id= ?
    `
    try{
    
      const [result] = await db.query(sql,[ping_id,ownerId])
      console.log(result)
      if (result.length === 0){
       
       try {
    const sql=`
    SELECT * FROM pings
    WHERE ping_id= ?
    `
       
        const [result] = await db.query(sql,[ping_id])
        if (result.length === 0){ 
        await interaction.reply({ content: "ping doesn't exist", ephemeral: true }); 
          return 
        } else {
        await interaction.reply({ content: "you do not own this ping", ephemeral: true }); 
          return
        }
       
      
      }
       catch (err){
        console.log(err)
        return
       }
      }
    }
    catch (err) {
        console.log(err)
      return
    }
    
    
    
    
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
try{
  const [result] =await db.query(sql) 
       

        console.log(`[Scheduler] 📊 Query matched ${result.length} ping(s) for the current UTC minute.`);

        for (const row of result) {
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
      }
    catch (err) {
            console.error("[Scheduler] ❌ SQL Error fetching pings:", err);
            return;
        }
}

setInterval(async () => {
    checkAndSendPings();
    console.log("minute check");
}, 60 * 1000);

client.login(process.env.DISCORD_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Server running on port ${PORT}`);
});