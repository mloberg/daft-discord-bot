package cmd

import (
	"fmt"

	"github.com/bwmarrin/discordgo"

	"github.com/mloberg/daft-discord-bot/pkg/dgc"
)

var nextCmd = &dgc.Command{
	Name:        "next",
	Description: "Skip current song",
	Run: func(s *discordgo.Session, i *discordgo.InteractionCreate) error {
		player := players[i.GuildID]
		if player == nil {
			return fmt.Errorf("not currently playing in this guild")
		}

		player.Next()

		return s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Skipped to next song",
			},
		})
	},
}

func init() {
	commands.AddCommand(nextCmd)
}
