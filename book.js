const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const FlightModel = require('../../Schemas/flightSchema');
const botDecoration = require('../../Core/decoration');
const DestinationModel = require('../../Schemas/destinationSchema');
const trueValue = require('../../Core/trueValue');
const PassengerModel = require('../../Schemas/passengerSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('book')
        .setDescription('Book a flight')
        .addStringOption(option =>
            option
                .setName('departure')
                .setDescription('Select your departing city')
                .addChoices(
                    { name: 'Arborfield', value: `arborfield`},
                    { name: 'Prominence', value: `prominence`},
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('destination')
                .setDescription('Select your destination city')
                .addChoices(
                    { name: 'Arborfield', value: `arborfield`},
                    { name: 'Prominence', value: `prominence`},
                )
                .setRequired(true)),

    async execute(interaction) {

        const findUser = await PassengerModel.findOne({ userID: interaction.user.id });
        if (findUser) {
            const existingFlightEmbed = new EmbedBuilder()
                .setTitle('Unable to Book')
                .setDescription(`You have already booked a flight with a flight number of **${findUser.flightNumber}**. You are only able to book a ticket for one flight at a time.\n\nRun \`/cancel\` to cancel the ticket to be able to book a new flight.`)
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            existingFlightEmbed.setFooter({
                iconUR: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.reply({ embeds: [existingFlightEmbed], ephemeral: true });
        }
        const selectedDeparture = trueValue.trueVar(interaction.options.getString('departure'));
        const selectedDestination = trueValue.trueVar(interaction.options.getString('destination'));

        const flightDoc = await FlightModel.find({ departure: selectedDeparture, destination: selectedDestination, open: 'True', status: 'Upcoming' });
        if (flightDoc.length === 0) {
            const noFlightsEmbed = new EmbedBuilder()
                .setTitle('No Matching Flights Found')
                .setDescription('No upcoming flights matching your departure and destination criteria were found. Check back in later to see if an upcoming flight that matches your criteria exists.')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            noFlightsEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.reply({ embeds: [noFlightsEmbed], ephemeral: true });
        }

        const matchingFlightsArray = await Promise.all(flightDoc.map(async (flightData, index) => {
            const member = await interaction.guild.members.fetch(flightData.userID);
            return `**Match ${index + 1} **
                Flight Number: ${flightData.flightNumber}
                Flight Host: ${member}
                Date of Flight: ${flightData.dateAndTime}
                Number of Seats Left: ${flightData.seats}
                City of Departure: ${flightData.departure}
                Destination City: ${flightData.destination}
                Flight Route: ${flightData.route}`;
        }));



        const matchingFlightsEmbed = new EmbedBuilder()
            .setTitle('Matching Flights')
            .setDescription(matchingFlightsArray.join('\n\n'))
            .setColor(botDecoration.color)
            .setThumbnail(botDecoration.thumbnail);

        matchingFlightsEmbed.setFooter({
            iconURL: botDecoration.thumbnail,
            text: botDecoration.text,
        });

        const flightButtons = flightDoc.map((flightData, index) =>
            new ButtonBuilder()
                .setCustomId(`flight${flightData.flightNumber}`)
                .setLabel(`Flight ${flightData.flightNumber}`)
                .setStyle(ButtonStyle.Primary));

        const flightRow = new ActionRowBuilder()
            .addComponents(...flightButtons);

        const initial1 = await interaction.reply({ embeds: [matchingFlightsEmbed], components: [flightRow], ephemeral: true });
        const collectorFilter = i => i.user.id === interaction.user.id;
        const trueInitial1 = await initial1.awaitMessageComponent({ filter: collectorFilter });
        if (trueInitial1.customId.startsWith('flight')) {

            const FlightbuttonID = trueInitial1.customId;
            const flightNumberSearch = FlightbuttonID.slice(6);
            const foundFlight = await FlightModel.findOne({ flightNumber: flightNumberSearch });

            const foundFlightEmbed = new EmbedBuilder()
                .setTitle(`Flight ${flightNumberSearch}`)
                .setDescription('You can find basic data about the flight you selected below. **Is this the flight you want to book a ticket for?**')
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail)
                .addFields(
                    { name: 'Flight Number', value: `${flightNumberSearch}`},
                    { name: 'Flight Host', value: `${await interaction.guild.members.fetch(foundFlight.userID)}`},
                    { name: 'Date and Time of Flight', value: `${foundFlight.dateAndTime}`},
                    { name: 'City of Departure', value: `${foundFlight.departure}`},
                    { name: 'Destination City', value: `${foundFlight.destination}`},
                    { name: 'Flight Route', value: `${foundFlight.route}`},
                    { name: 'Flight Type', value: `${foundFlight.flightType}`},
                );

            foundFlightEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            const continueButton = new ButtonBuilder()
                .setCustomId('continueButton')
                .setLabel('Continue Booking')
                .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancelButton')
                .setLabel('Cancel Booking')
                .setStyle(ButtonStyle.Danger);

            const confirmFlightRow = new ActionRowBuilder()
                .addComponents(continueButton, cancelButton);

            const initial2 = await trueInitial1.update({ embeds: [foundFlightEmbed], components: [confirmFlightRow], ephemeral: true });
            const trueInitial2 = await initial2.awaitMessageComponent({ filter: collectorFilter });

            if (trueInitial2.customId === 'continueButton') {

                const regulationsEmbed = new EmbedBuilder()
                    .setTitle('Flight Regulations')
                    .setDescription('**To ensure the safety of all passengers and crew, you are required to adhere to the standards below at all times before and during the flight:**\n\n- Follow all cabin crew and pilot instructions\n- Stay within the green lines of the heliport\n- You may not bring any weapons into the heliport or onboard the rotorcraft\n- Crime is strictly prohibited at all times before and during the flight\n- FRP is strictly prohibited, including jumping out of the helicopter\n- Do not enter the rotorcraft until the pilot has given you permission to do so\n- Remain respectful and follow all rules mentioned in the rules channel\n- Use common sense, just because it is isnt mentioned here doesn\'t mean you should do it\n- Breaking these rules may result in legal consequences within the State of Firestone\n\n**You can also find an image below with prohibited items/actions.**')
                    .setColor(botDecoration.color)
                    .setThumbnail(botDecoration.thumbnail)
                    .setImage('https://cdn.discordapp.com/attachments/1242966391645278348/1244762158231978055/Prohibited_ItemsActions.png?ex=66564a99&is=6654f919&hm=454886cb775f43d0477ca27218bdf4c741f7507ce3453d20186ecff633d80cea&');

                regulationsEmbed.setFooter({
                    iconURL: botDecoration.thumbnail,
                    text: botDecoration.text,
                });

                const agreeTerms = new ButtonBuilder()
                    .setCustomId('agreeTerms')
                    .setLabel('Agree and Acknowledge')
                    .setStyle(ButtonStyle.Success);

                const termsAgreeFlightRow = new ActionRowBuilder()
                    .addComponents(agreeTerms);

                const initial3 = await trueInitial2.update({ embeds: [regulationsEmbed], components: [termsAgreeFlightRow], ephemeral: true });
                const trueInitial3 = await initial3.awaitMessageComponent({ filter: collectorFilter });

                if (trueInitial3.customId === 'agreeTerms') {
                    const overviewEmbed = new EmbedBuilder()
                        .setTitle('Booking Overview')
                        .setDescription('You can find an overview of your booking data below. Click the finish button to finish your booking process.')
                        .addFields(
                            { name: 'Flight Number', value: `${flightNumberSearch}`},
                            { name: 'Flight Host', value: `${await interaction.guild.members.fetch(foundFlight.userID)}`},
                            { name: 'Date and Time of Flight', value: `${foundFlight.dateAndTime}`},
                            { name: 'City of Departure', value: `${foundFlight.departure}`},
                            { name: 'Destination City', value: `${foundFlight.destination}`},
                            { name: 'Flight Route', value: `${foundFlight.route}`},
                            { name: 'Flight Type', value: `${foundFlight.flightType}`},
                        )
                        .setColor(botDecoration.color)
                        .setThumbnail(botDecoration.thumbnail);

                    overviewEmbed.setFooter({
                        iconURL: botDecoration.thumbnail,
                        text: botDecoration.text,
                    });

                    const finishBooking = new ButtonBuilder()
                        .setCustomId('finish')
                        .setLabel('Finish Booking')
                        .setStyle(ButtonStyle.Success)

                    const cancelFinal = new ButtonBuilder()
                        .setCustomId('cancelBooking2')
                        .setLabel('Cancel Booking')
                        .setStyle(ButtonStyle.Danger);

                    const finishBookingRowNow = new ActionRowBuilder()
                        .addComponents(finishBooking, cancelFinal);

                    const initial4 = await trueInitial3.update({ embeds: [overviewEmbed], components: [finishBookingRowNow], ephemeral: true });
                    const trueInitial4 = await initial4.awaitMessageComponent({ filter: collectorFilter });

                    if (trueInitial4.customId === 'finish') {

                        const findFlightDoc = await FlightModel.findOne({ flightNumber: flightNumberSearch });

                        const newTotal = String(Number(findFlightDoc.seats) - 1);
                        let newOpenStatus = 'unknown';

                        if (newTotal === 0) {
                            newOpenStatus = 'False';
                        } else {
                            newOpenStatus = 'True';
                        }

                        const referenceNumber = String(Math.ceil(Math.random() * (100000 - 10000) + 10000));

                        const newPassengerData = findFlightDoc.passengers.push({
                            userID: interaction.user.id,
                            referenceNumber: referenceNumber,
                            checkedIn: 'False',
                            foodItems: [],
                            flightItems: 'False',
                            seatNumber: 'Unknown',
                            identification: [],
                            arrivedForFlight: 'False',
                        });

                        findFlightDoc.seats = newTotal;
                        findFlightDoc.open = newOpenStatus;

                        await findFlightDoc.save().catch(err => console.log(err));

                        const destinationDoc = await DestinationModel.findOne({ destinationName: selectedDestination });
                        const destinationImage = destinationDoc.destinationURL;

                        const finalizedEmbed = new EmbedBuilder()
                            .setTitle(`Booking Overview`)
                            .setDescription(`- **Reference Number: ${referenceNumber}**\n\nYou can find your reference number above. Use this number to look up specific details of your flight by running \`/reference\`. **Do not share your reference number with anyone. Doing so may compromise any current and future data about you regarding the flight**\n\nYou can run \`/check_in\` to check in to the flight. Once running the command, you can choose food and seat preferences along with other similar matters. To cancel your ticket, run the check-in command and select "Cancel Ticket".\n\n**All data regarding your flight can be found below:**`)
                            .setColor(botDecoration.color)
                            .setThumbnail(botDecoration.thumbnail)
                            .setImage(destinationImage)
                            .addFields(
                                { name: 'Flight Number', value: `${flightNumberSearch}`, inline: true },
                                { name: 'Flight Host', value: `${await interaction.guild.members.fetch(foundFlight.userID)}`, inline: true },
                                { name: 'Date and Time of Flight', value: `${foundFlight.dateAndTime}`, inline: true },
                                { name: 'City of Departure', value: `${foundFlight.departure}`, inline: true },
                                { name: 'Destination City', value: `${foundFlight.destination}`, inline: true },
                                { name: 'Flight Route', value: `${foundFlight.route}`, inline: true },
                                { name: 'Flight Type', value: `${foundFlight.flightType}`, inline: true },
                            );

                            await trueInitial4.update({ embeds: [finalizedEmbed], components: [], ephemeral: true });
                            await interaction.user.send({ embeds: [finalizedEmbed] });
                            const userDoc = new PassengerModel({
                                userID: interaction.user.id,
                                flightNumber: foundFlight.flightNumber,
                            });

                            await userDoc.save().catch(err => console.log(err));

                    } else if (trueInitial4.customId === 'cancelBooking2') {
                        await trueInitial4.update({ embeds: [], components: [], content: 'Booking process canceled', ephemeral: true });
                    }
                }

            } else if (trueInitial2.customId === 'cancelButton') {
                await trueInitial2.update({ embeds: [], components: [], content: 'Booking process canceled', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'There was an unexpected error, please try again', components: [], embeds: [], ephemeral: true });
        }
    },
};