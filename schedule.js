const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const FlightModel = require('../../Schemas/flightSchema');
const botDecoration = require('../../Core/decoration');
const trueValue = require('../../Core/trueValue');
const SeatModell = require('../../Schemas/seatSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule a flight')
        .addStringOption(option =>
            option
                .setName('departure')
                .setDescription('Where the flight will depart from')
                .addChoices(
                    { name: 'Arborfield', value: `arborfield`},
                    { name: 'Prominence', value: `prominence`},
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('destination')
                .setDescription('The flight\'s destination')
                .addChoices(
                    { name: 'Arborfield', value: `arborfield`},
                    { name: 'Prominence', value: `prominence`},
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('flight_type')
                .setDescription('Choose whether the flight is a round-trip flight or a one-way flight')
                .addChoices(
                    { name: 'Round-Trip', value: `round`},
                    { name: 'One-Way', value: `one`},
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('route')
                .setDescription('The flight route goes here')
                .addChoices(
                    { name: 'Black', value: 'black'},
                    { name: 'Pink', value: 'pink'},
                    { name: 'Orange', value: `orange`},
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('date_time')
                .setDescription('The date and time of the flight')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const flightNumber = String(Math.ceil(Math.random() * (9999 - 100) + 100));
        const departure = interaction.options.getString('departure');
        const destination = interaction.options.getString('destination');
        const flightType = interaction.options.getString('flight_type');
        const route = interaction.options.getString('route');
        const dateOf = interaction.options.getString('date_time');

        const trueDepart = trueValue.trueVar(departure);
        const trueDest = trueValue.trueVar(destination);
        const trueRoute = trueValue.trueVar(route);

        let trueFlight = 'unknown';

        if (flightType === 'round') {
            trueFlight = 'Round-Trip';
        } else if (flightType === 'one') {
            trueFlight = 'One-Way';
        } else {
            trueFlight = 'N/A'
        }

        const flightChannel = interaction.client.channels.cache.get('1213494720827756585');
        const flightDoc = new FlightModel({
            guildID: interaction.guild.id,
            flightNumber: flightNumber,
            departure: trueDepart,
            destination: trueDest,
            route: trueRoute,
            flightType: trueFlight,
            seats: '6',
            open: 'True',
            status: 'Upcoming',
            dateAndTime: dateOf,
            userID: interaction.user.id,
        });

        await flightDoc.save().catch(err => console.log(err));
        await interaction.reply({ content: 'Your flight has been schedule successfuly', ephemeral: true });
        
        const flightEmbed = new EmbedBuilder()
            .setTitle('New Flight Scheduled')
            .setDescription('A new flight has been scheduled. You can view the details below:')
            .setColor('Blue')
            .setThumbnail(botDecoration.thumbnail)
            .addFields(
                { name: 'Flight Number', value: `${flightNumber}`},
                { name: 'Departure Heliport', value: `${trueDepart}`},
                { name: 'Destination', value: `${trueDest}`},
                { name: 'Flight Route', value: `${trueRoute}`},
                { name: 'Flight Type', value: `${trueFlight}`},
                { name: 'Flight Host', value: `${interaction.member.displayName}`},
                { name: 'Date and Time', value: `${dateOf}`},
            );

        flightEmbed.setFooter({
            iconURL: botDecoration.thumbnail,
            text: botDecoration.text,
        });
        
        const verifiedRole = '1213513353427820575';
        const tag = `<@&${verifiedRole}>`;

        await flightChannel.send({ embeds: [flightEmbed] });
        const seatDocc = new SeatModell({
            flightNumber: flightNumber,
            seats: [],
        });
        await seatDocc.save().catch(err => console.log(err));
        const findSeat = await SeatModell.findOne({ flightNumber: flightNumber });
        const seats = [
            { seatNumber: '1A', seatX: 340, seatY: 119.7, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 368.9, textY: 133.6 },
            { seatNumber: '1B', seatX: 494.3, seatY: 119.7, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 494.3, textY: 189.65 },
            { seatNumber: '2A', seatX: 340, seatY: 231.8, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 340, textY: 301.75 },
            { seatNumber: '2B', seatX: 494.3, seatY: 231.8, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 494.3, textY: 301.75 },
            { seatNumber: '3A', seatX: 340, seatY: 343.9, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 340, textY: 413.05 },
            { seatNumber: '3B', seatX: 494.3, seatY: 343.9, width: 120.4, height: 91.1, seatColor: '#58A241', seatStatus: 'Open', textX: 494.3, textY: 413.05 },
        ];

        for (i = 0; i < seats.length; i++) {
            findSeat.seats.push(seats[i]);
            await findSeat.save().catch(err => console.log(err));
        }

    },
};
