const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const botDecoration = require('../../Core/decoration');
const trelloRequest = require('../../Core/trelloRequest');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_blacklist')
        .setDescription('Check to see if a Roblox user has a DOCM, Public Safety, or FCC blacklist')
        .addStringOption(option =>
            option
                .setName('user')
                .setDescription('The username (Roblox) of the user who\'s blacklist you want to check')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getString('user');
        const userID = await noblox.getIdFromUsername(user);

        if (!userID) {
            return await interaction.reply({ content: `Unable to find user **${user}**`, ephemeral: true });
        }
        await interaction.deferReply();
        const playerThumbnail = await noblox.getPlayerThumbnail(Number(userID), 420, "png", true, "Headshot");
        const playerAvatar = playerThumbnail[0].imageUrl;
        let trueOrNot = 'Unknown';
        let titleTrueOrNot = 'Unknown';
        const response = await trelloRequest.getBlacklists(user);

        if (response === 'This user has blacklists') {
            trueOrNot = `**${user}** has blacklists, please contact a staff member if you believe that this is incorrectt`;
            titleTrueOrNot = `Blacklists for ${user}`;
        } else if (response === 'This user does not have blacklists') {
            trueOrNot = `**${user}** does not have blacklists, please contact a staff member if you believe that this is incorrectt`;
            titleTrueOrNot = `No Blacklists for **${user}**`;
        } else if (response instanceof Object) {
            trueOrNot = 'An error with your HyperText Transfer Protocal (HTTP) request has ocurred, please try again later';
            titleTrueOrNot = response.code;
            const embed = new EmbedBuilder()
                .setTitle(titleTrueOrNot)
                .setDescription(trueOrNot)
                .setColor(botDecoration.color)
                .setThumbnail(botDecoration.thumbnail);

            embed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

            return await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle(titleTrueOrNot)
            .setDescription(trueOrNot)
            .setColor(botDecoration.color)
            .setThumbnail(botDecoration.thumbnail)
            .setImage(playerAvatar);

        resultEmbed.setFooter({
                iconURL: botDecoration.thumbnail,
                text: botDecoration.text,
            });

        await interaction.editReply({ embeds: [resultEmbed], ephemeral: true });
    },
}