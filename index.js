const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js'); //import client and intents (events) from discord
const { token } = require("./config.json");
const { TicTacToe } = require('./databaseObjects.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('Ready!');
})

client.on('messageCreate', (message) => { //bots checks for event: message created
    if(message.author.id === client.user.id) return;

    if(message.content === "ping") {
        message.channel.send("pong");
    }
    //i wanna add more !!!
})




/* Tic Tac Toe */
let EMPTY = Symbol("empty");
let PLAYER = Symbol("player");
let BOT = Symbol("bot");

let tictactoe_state

function makeGrid() {
    components = []

    for (let row = 0; row < 3; row++) {
        actionRow = new MessageActionRow();

        for (let col = 0; col < 3; col++) {
            
            messageButton = new MessageButton()
                .setCustomId('tictactoe_' + row + '_' + col)
            switch(tictactoe_state[row][col]) {
                case EMPTY:
                    messageButton
                        .setLabel(' ')
                        .setStyle('SECONDARY')
                    break;
                case PLAYER:
                    messageButton 
                        .setLabel('X')
                        .setStyle('PRIMARY')
                    break;
                case BOT:
                    messageButton 
                        .setLabel('O')
                        .setStyle('DANGER')
                    break;
            }
            actionRow.addComponents(messageButton)
        }
        components.push(actionRow);
    }
    return components
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function isDraw() {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (tictactoe_state[row][col] == EMPTY) {
                return false;
            }
        }
    }
    return true;
}

function isGameOver() {
    for (let i = 0; i < 3; i++) {
        if (tictactoe_state[i][0] != EMPTY && tictactoe_state[i][0] === tictactoe_state[i][1] && tictactoe_state[i][1] === tictactoe_state[i][2]) {
            return true;
        }
    else if (tictactoe_state[0][i] != EMPTY && tictactoe_state[0][i] === tictactoe_state[1][i] && tictactoe_state[1][i] === tictactoe_state[2][i]) {
            return true;
        }
    }
    if (tictactoe_state[0][0] != EMPTY && tictactoe_state[0][0] === tictactoe_state[1][1] && tictactoe_state[1][1] === tictactoe_state[2][2]) {
        return true;
    }
    else if (tictactoe_state[0][2] != EMPTY && tictactoe_state[0][2] === tictactoe_state[1][1] && tictactoe_state[1][1] === tictactoe_state[2][0]) {
        return true;
    }
    return false;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('tictactoe')) return;
    if (isGameOver() || isDraw()) {
        interaction.update({
            components: makeGrid()
        })
        return;
    }

    let parsedFields = interaction.customId.split("_")
    let row = parsedFields[1]
    let col = parsedFields[2]

    if (tictactoe_state[row][col] != EMPTY) {
        interaction.update({
            content: "You Can't Select That!",
            components: makeGrid()
        })
        return;
    }
    tictactoe_state[row][col] = PLAYER;

    if (isDraw()) {
        interaction.update({
            content: "It's a Draw :/",
            components: makeGrid()
        })
        return;
    }

    if (isGameOver()) {
        let user = await TicTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });
        if(!user) {
            user = await TicTacToe.create({ user_id: interaction.user.id });
        }

        user.increment('score');

        interaction.update({
            content: "You Win! Nice Job! You have won " + (user.get('score') + 1) + " time(s)",
            components: makeGrid()
        })
        return;
    }

    /* Bot Functionality */
    let botRow
    let botCol
    //bunch of ugly logic for making the bot smarter (but not that smart, there's ways to trick it)
    let twoInARow = false;
    for (let i = 0; i < 3; i++) {
        if (tictactoe_state[i][0] != EMPTY && tictactoe_state[i][0] === tictactoe_state[i][1] && tictactoe_state[i][2] === EMPTY) {
            botRow = i
            botCol = 2
            twoInARow = true
        }
        else if (tictactoe_state[i][0] != EMPTY && tictactoe_state[i][0] === tictactoe_state[i][2] && tictactoe_state[i][1] === EMPTY) {
            botRow = i
            botCol = 1
            twoInARow = true
        }
        else if (tictactoe_state[i][1] != EMPTY && tictactoe_state[i][0] === tictactoe_state[i][1] && tictactoe_state[i][0] === EMPTY) {
            botRow = i
            botCol = 0
            twoInARow = true
        }
        else if (tictactoe_state[0][i] != EMPTY && tictactoe_state[0][i] === tictactoe_state[1][i] && tictactoe_state[2][i] === EMPTY) {
            botRow = 2
            botCol = i
            twoInARow = true
        }
        else if (tictactoe_state[0][i] != EMPTY && tictactoe_state[0][i] === tictactoe_state[2][i] && tictactoe_state[1][i] === EMPTY) {
            botRow = 1
            botCol = i
            twoInARow = true
        }
        else if (tictactoe_state[1][i] != EMPTY && tictactoe_state[1][i] === tictactoe_state[2][i] && tictactoe_state[0][i] === EMPTY) {
            botRow = 0
            botCol = i
            twoInARow = true
        }
    }
    if (tictactoe_state[0][0] != EMPTY && tictactoe_state[0][0] === tictactoe_state[1][1] && tictactoe_state[2][2] === EMPTY) {
        botRow = 2
        botCol = 2
        twoInARow = true
    }
    else if (tictactoe_state[0][0] != EMPTY && tictactoe_state[0][0] === tictactoe_state[2][2] && tictactoe_state[1][1] === EMPTY) {
        botRow = 1
        botCol = 1
        twoInARow = true
    }
    else if (tictactoe_state[1][1] != EMPTY && tictactoe_state[1][1] === tictactoe_state[2][2] && tictactoe_state[0][0] === EMPTY) {
        botRow = 0
        botCol = 0
        twoInARow = true
    }
    else if (tictactoe_state[0][2] != EMPTY && tictactoe_state[0][2] === tictactoe_state[1][1] && tictactoe_state[2][0] === EMPTY) {
        botRow = 2
        botCol = 0
        twoInARow = true
    }
    else if (tictactoe_state[0][2] != EMPTY && tictactoe_state[0][2] === tictactoe_state[2][2] && tictactoe_state[1][1] === EMPTY) {
        botRow = 1
        botCol = 1
        twoInARow = true
    }
    else if (tictactoe_state[1][1] != EMPTY && tictactoe_state[1][1] === tictactoe_state[2][0] && tictactoe_state[0][2] === EMPTY) {
        botRow = 0
        botCol = 2
        twoInARow = true
    }

    if (!twoInARow) {
        do {
            botRow = getRandomInt(3)
            botCol = getRandomInt(3)
        } while(tictactoe_state[botRow][botCol] != EMPTY);
    }
    tictactoe_state[botRow][botCol] = BOT;

    if (isGameOver()) {
        interaction.update({
            content: "You Lose >:)",
            components: makeGrid()
        })
        return;
    }

    interaction.update({
        components: makeGrid()
    })
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;
    
    const { commandName } = interaction;

    if (commandName === 'help') {
        
    }
    if (commandName === 'tictactoe') {
        tictactoe_state = [
            [EMPTY,EMPTY,EMPTY],
            [EMPTY,EMPTY,EMPTY],
            [EMPTY,EMPTY,EMPTY]
        ]

        await interaction.reply({ content: 'Playing a game of tic-tac-toe!', components: makeGrid() });
    }
})

/* */

client.login(token);
