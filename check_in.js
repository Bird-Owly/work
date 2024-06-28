const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const noblox = require('noblox.js');
const botDecoration = require('../../Core/decoration');
const trueValue = require('../../Core/trueValue');
const FlightModel = require('../../Schemas/flightSchema');
const TransferModel = require('../../Schemas/transferSchema');
const DestinationModel = require('../../Schemas/destinationSchema');
const CacheModel = require('../../Schemas/cacheSchema');
const RobloxIDModel = require('../../Schemas/robloxIDSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_in')
        .setDescription('Check-in to your flight')
        .addStringOption(option =>
            option
                .setName('reference_number')
                .setDescription('Input your flight reference number here')
                .setRequired(true)),

    async execute(interaction) {
        const cacheDocc = await CacheModel.findOne({ userID: interaction.user.id });
        const robloxDocc = await RobloxIDModel.findOne({ userID: interaction.user.id });

        if (cacheDocc) {
           await CacheModel.deleteOne({ userID: interaction.user.id }); 
        }

        if (robloxDocc) {
            await RobloxIDModel.deleteOne({ userID: interaction.user.id });
        }
        
        const referenceNumber = interaction.options.getString('reference_number');

        const flightDoc = await FlightModel.findOne({ 'passengers.referenceNumber': referenceNumber });
        if (!flightDoc) {
            const noFlightFoundEmbed = new EmbedBuilder()
                .setTitle('No Matching Flight Found')
                .setDescription('No flight matching the reference number you submitted was found. Please ensure that you have entered the reference number **exactly** as it appears in the confirmation message you recieved when you booked a ticket for the flight.\n\n**If the issue persists, please contact a staff member.**')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            noFlightFoundEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.reply({ embeds: [noFlightFoundEmbed], ephemeral: true });
        }
        const specificPassengerIndex = flightDoc.passengers.findIndex(p => p.referenceNumber === referenceNumber);
        const specificPassenger = flightDoc.passengers[specificPassengerIndex];

        if (interaction.user.id !== specificPassenger.userID) {
            const noAccessEmbedd = new EmbedBuilder()
                .setTitle('Check-In Permission Block')
                .setDescription('You do not have permission to check-in under this reference number. Please ensure that you are using your reference number and not someone else\'s.\n\n**Contact a staff member if you believe that there was an error.**')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            noAccessEmbedd.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.reply({ embeds: [noAccessEmbedd], ephemeral: true });
        }

        if (specificPassenger.checkedIn === 'True') {
            const alreadyCheckedInEmbed = new EmbedBuilder()
                .setTitle('Already Checked-In')
                .setDescription('You are already checked-in and can not check-in again. **If you wish to reconfigure your check-in options, please run `/pannel` and follow the options there. If you wish to cancel your ticket, run `/cancel.`**')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            alreadyCheckedInEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.reply({ embeds: [alreadyCheckedInEmbed], ephemeral: true });
        }

        const welcomeScreenEmbed = new EmbedBuilder()
            .setTitle('Check-In Process')
            .setDescription('Follow the check-in process to check into your flight. **You are required to check into your flight to access the following:**\n\n- Your boarding pass\n\n- Food menu\n\n- In-flight items\n\n- Security conformation\n\n**It is recommended to only check-in to your flight around an hour before it is set to start and no later than 10 minutes before it starts. Ensure that all data you submit is accurate and will match the current state of your data when the flight starts.**')
            .setColor(botDecoration.color)
            .setThumbnail(botDecoration.thumbnail);

        welcomeScreenEmbed.setFooter({
            iconURL: botDecoration.thumbnail,
            text: botDecoration.text,
        });

        const continueCheckIn = new ButtonBuilder()
            .setCustomId('continueCheckIn')
            .setLabel('Continue Checking-In')
            .setStyle(ButtonStyle.Success);

        const cancelCheckInn = new ButtonBuilder()
            .setCustomId('cancel1')
            .setLabel('Cancel and Return')
            .setStyle(ButtonStyle.Danger);

        const continueRow = new ActionRowBuilder()
            .addComponents(continueCheckIn, cancelCheckInn);

        const initial1 = await interaction.reply({ embeds: [welcomeScreenEmbed], components: [continueRow], ephemeral: true });
        const collectorFilter = i => i.user.id === interaction.user.id;
        const trueInitial1 = await initial1.awaitMessageComponent({ filter: collectorFilter });

        if (trueInitial1.customId === 'continueCheckIn') {

            const flightDataEmbed = new EmbedBuilder()
                .setTitle('Flight Data')
                .setDescription('You can find the data about the flight you are checking into below:')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail)
                .addFields(
                    { name: 'Flight Number', value: `${flightDoc.flightNumber}`},
                    { name: 'Flight Host', value: `${await interaction.guild.members.fetch(flightDoc.userID)}`},
                    { name: 'Date of Flight', value: `${flightDoc.dateAndTime}`},
                    { name: 'Departing City', value: `${flightDoc.departure}`},
                    { name: 'Destination City', value: `${flightDoc.destination}`},
                    { name: 'Flight Route', value: `${flightDoc.route}`},
                    { name: 'Flight Type', value: `${flightDoc.flightType}`},        
                );

            flightDataEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            const continueFlight = new ButtonBuilder()
                .setCustomId('continueFlight')
                .setLabel('Continue Checking In')
                .setStyle(ButtonStyle.Success);

            const cancelCheck2 = new ButtonBuilder()
                .setCustomId('cancel2')
                .setLabel('Cancel Checking In')
                .setStyle(ButtonStyle.Danger);

            const dataConfirmRow = new ActionRowBuilder()
                .addComponents(continueFlight, cancelCheck2);

            const initial2 = await trueInitial1.update({ embeds: [flightDataEmbed], components: [dataConfirmRow], ephemeral: true });
            const trueInitial2 = await initial2.awaitMessageComponent({ filter: collectorFilter });

            if (trueInitial2.customId === 'continueFlight') {

                const securityEmbed = new EmbedBuilder()
                    .setTitle('Prohibited Items and Actions')
                    .setDescription('Please ensure that you do not have any of the prohibited items listed in the image below:')
                    .setColor(botDecoration.color)
                    .setThumbnail(botDecoration.thumbnail)
                    .setImage('https://cdn.discordapp.com/attachments/1242966391645278348/1244762158231978055/Prohibited_ItemsActions.png?ex=66564a99&is=6654f919&hm=454886cb775f43d0477ca27218bdf4c741f7507ce3453d20186ecff633d80cea&');

                securityEmbed.setFooter({
                    iconURL: botDecoration.thumbnail,
                    text: botDecoration.text,
                });

                const continueButtonAgain = new ButtonBuilder()
                    .setCustomId('continueAgain')
                    .setLabel('Continue Checking In')
                    .setStyle(ButtonStyle.Success);

                const cancelButtonAgain = new ButtonBuilder()
                    .setCustomId('cancelAgain')
                    .setLabel('Cancel Checking In')
                    .setStyle(ButtonStyle.Danger);

                const securityRow = new ActionRowBuilder()
                    .addComponents(continueButtonAgain, cancelButtonAgain);

                await trueInitial2.update({ embeds: [securityEmbed], components: [securityRow], ephemeral: true });

            } else if (trueInitial2.customId === 'cancel2') {
                await trueInitial2.update({ components: [], embeds: [], content: 'Check-in process has been canceled', ephemeral: true });
            }

        } else if (trueInitial1.customId === 'cancel1') {
            console.log('Cancel Selected sdfasdklafjskld')
            await trueInitial1.update({ embeds: [], components: [], content: 'Check-in process canceled as of now', ephemeral: true });
        }


    },
};
