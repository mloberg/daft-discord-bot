package cmd

import (
	"fmt"

	"github.com/bwmarrin/discordgo"

	"github.com/mloberg/daft-discord-bot/pkg/dgc"
)

var stopCmd = &dgc.Command{
	Name:        "stop",
	Description: "Stop music",
	Run: func(s *discordgo.Session, i *discordgo.InteractionCreate) error {
		player := players[i.GuildID]
		if player == nil {
			return fmt.Errorf("not currently playing in this guild")
		}

		player.Stop()

		return s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Playlist stopped",
				Flags:   dgc.InteractionResponseEphemeral,
			},
		})
	},
}

func init() {
	commands.AddCommand(stopCmd)
}
