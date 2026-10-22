require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
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

//discord code section below:
//--------------------------
//discord var init section
//--------------------------
const serverid = process.env.SERVER_ID;
const allTimezones = Intl.supportedValuesOf('timeZone');

const commands = [
  {
    name: 'create_ping',
    description: 'Create a new accountability ping',
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
        description: 'Your accountability partner',
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
  }
];
//--------------------------

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

// Listen for interactions (Autocomplete and Slash Commands)
client.on('interactionCreate', async (interaction) => {
  // 1. Handle Autocomplete live filtering
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'set_time_zone') {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const filtered = allTimezones
        .filter(tz => tz.toLowerCase().includes(focusedValue))
        .slice(0, 25); // Discord max limit per response

      await interaction.respond(
        filtered.map(tz => ({ name: tz, value: tz }))
      );
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // 2. Handle /create_ping command
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
    ( user_id, ping_name, target_channel, pinged_partner_id, message, score) 
  VALUES 
    ( ?, ?, ?, ?, ?, ?)
`;
db.query(sql,[ ownerId,ping_name,channel.id,partner ? partner.id : null ,msg,score],(err,result)=>{
  if (err){console.log(err)} else {console.log("success?")}
})
  }


  // 3. Handle /set_time_zone command
  if (interaction.commandName === 'set_time_zone') {
    const chosenTimezone = interaction.options.getString('timezone');
    const ownerId = interaction.user.id;

    if (!allTimezones.includes(chosenTimezone)) {
      return await interaction.reply({
        content: `\`${chosenTimezone}\` is not a valid IANA timezone. Please select one from the suggestion list.`,
        ephemeral: true
      });
    }

    // Later: save chosenTimezone and interaction.user.id to your MySQL database users table here
    await interaction.reply({
      content: `Your timezone has been set to **${chosenTimezone}**!`,
      ephemeral: true
    });
    console.log(chosenTimezone)
    const sql="INSERT INTO users (user_id,timezone) VALUES (?,?) ON DUPLICATE KEY UPDATE timezone = VALUES(timezone) "
    db.query(sql,[ownerId,chosenTimezone],(err,result)=>{
          if (err) console.log(err)
    })

    //ownerId  chosenTimezone
  }
});

// Log the bot in
client.login(process.env.DISCORD_TOKEN);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});