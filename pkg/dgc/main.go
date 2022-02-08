package dgc

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

// Commander represents Discord slash commands
type Commander struct {
	commands map[string]*Command
}

// NewCommander returns a new command collection
func NewCommander() *Commander {
	return &Commander{
		commands: map[string]*Command{},
	}
}

// AddCommand adds a new slash command
func (m *Commander) AddCommand(c *Command) {
	m.commands[c.Name] = c
}

// Handler handles interaction create events from Discord
func (m *Commander) Handler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	name := i.ApplicationCommandData().Name
	log.Debug().
		Str("command", name).
		Str("guild", i.GuildID).
		Str("channel", i.ChannelID).
		Str("user", GetUser(i).String()).
		Msg("Interaction created")

	if c, ok := m.commands[name]; ok {
		if err := c.Run(s, i); err != nil {
			err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: fmt.Sprintf("An error occurred: %v", err),
				},
			})
			if err != nil {
				log.Error().Err(err).Str("command", name).Msg("Could not respond to interaction")
			}
		}
	}
}
