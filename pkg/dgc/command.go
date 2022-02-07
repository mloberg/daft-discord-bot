package dgc

import "github.com/bwmarrin/discordgo"

// Command represents a Discord slash command
type Command struct {
	Name        string
	Description string
	Options     []*discordgo.ApplicationCommandOption

	Run func(s *discordgo.Session, i *discordgo.InteractionCreate) error
}
