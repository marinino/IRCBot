const {SlashCommandBuilder} = require('@discordjs/builders');
const CurrentSeason = require('./startseasonliga2.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeabmeldung2')
        .setDescription('Can reverse if a driver was withdrawn before')
        .addUserOption(option => 
            option.setName('fahrer')
                .setDescription('Fahrer dessen Abmeldung zurück genommen werden soll')
                .setRequired(true)),

    async execute(client, interaction, command){

        if(!interaction.member.roles.cache.has(CurrentSeason.seasonData.getRennleiterRolleID())){
            interaction.reply('Permission denied')
            return;
        }else{
            console.log('all good')
        }

        const userToRemoveWithdraw = interaction.options.getUser('fahrer');
        console.log(client.guilds.cache.get(CurrentSeason.seasonData.getDiscordID()).members.cache.get(userToRemoveWithdraw.id))

        if(!(CurrentSeason.seasonData.getWithdrawnDriversPerCommandLiga2().includes(userToRemoveWithdraw.id))){
            interaction.reply('Fahrer wurde nicht per Command abgemeldet');
            return
        } else {
            if(!(client.guilds.cache.get(CurrentSeason.seasonData.getDiscordID()).members.cache.get(userToRemoveWithdraw.id).roles.cache.has(CurrentSeason.seasonData.getStammfahrerRolleIDLiga2()))){
                interaction.reply('Fahrer hat die Stammfahrer nicht');
                return
            }

            await interaction.reply(`Bei ${userToRemoveWithdraw.username} wird die Abmeldung zurück genommen `)
            let confirmMessage = await interaction.channel.send(`Bist du sicher, dass du die Abmeldung von ${userToRemoveWithdraw.username} zurück nehmen möchtest?`);
            confirmMessage.react(CurrentSeason.seasonData.getAnmeldeEmoji());
            confirmMessage.react(CurrentSeason.seasonData.getAbmeldeEmoji());

            const collectorConfirm = confirmMessage.createReactionCollector({ dispose: true});

            collectorConfirm.on('collect', async (reaction, user) => {
                if(reaction.message.partial){
                    await reaction.message.fetch();
                }
                if(reaction.partial){
                    await reaction.fetch();
                }
                if(user.bot){
                    return;
                }
                if(!(reaction.message.guild)){
                    return;
                }
                if(reaction.emoji.name == CurrentSeason.seasonData.getAnmeldeEmoji()){
                    // Remove Withdraw
                    CurrentSeason.methodStorage.regularDriverRemoveWithdraw(client, userToRemoveWithdraw, CurrentSeason.seasonData);
                    // Changes content of list
                    let tempArray = CurrentSeason.seasonData.getWithdrawnDriversPerCommandLiga2();
                    tempArray.splice(tempArray.indexOf(userToRemoveWithdraw.id), 1);
                    CurrentSeason.seasonData.setWithdrawnDriversPerCommandLiga2(tempArray); 
                    // Deletes message
                    await confirmMessage.delete();
                } else if(reaction.emoji.name == CurrentSeason.seasonData.getAbmeldeEmoji()){
                    await confirmMessage.delete();
                    await interaction.channel.send(`Der Vorgang wurde erfolgreich abgebrochen`).then(() => {
                        let date = new Date().toLocaleString();
                        console.log(`Der manuelle Abmeldeentfernungsprozess wurde gestartet und abgebrochen ${CurrentSeason.seasonData.getLigatitel()} -- ${date}`)
                    });
                } else {
                    confirmMessage.reply('Es wurde mit dem falschen Emoji reagiert').then(() => {
                      let date = new Date().toLocaleString();
                      console.log(`Der manuelle Abmeldeprozess wurde gestartet aber es wurde mit dem falschen Emoji `+
                                    `reagiert in ${CurrentSeason.seasonData.getLigatitel()} -- ${date}`)
                      reaction.users.remove(user.id);
                    })
                  }
            })
        }

    }  
}