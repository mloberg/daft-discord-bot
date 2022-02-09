package dgc

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

type (
	// ErrorHandler represents an error handler function
	ErrorHandler func(error, *discordgo.Session, *discordgo.InteractionCreate) error

	// Commander represents Discord slash commands
	Commander struct {
		errorHandler ErrorHandler
		commands     map[string]*Command
	}
)

// NewCommander returns a new command collection
func NewCommander() *Commander {
	return &Commander{
		errorHandler: DefaultErrorHandler,
		commands:     map[string]*Command{},
	}
}

// OnError sets the error handler when an error is returned from a command
func (m *Commander) OnError(h ErrorHandler) {
	m.errorHandler = h
}

// AddCommand adds a new slash command
func (m *Commander) AddCommand(c *Command) {
	m.commands[c.Name] = c
}

// Handler handles interaction create events from Discord
func (m *Commander) Handler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	name := i.ApplicationCommandData().Name
	l := log.With().
		Str("interaction", i.ID).
		Str("command", name).
		Str("guild", i.GuildID).
		Str("channel", i.ChannelID).
		Str("user", GetUser(i).String()).
		Logger()
	l.Debug().Msg("Interaction created")

	if c, ok := m.commands[name]; ok {
		if err := c.Run(s, i); err != nil {
			l.Error().Err(err).Msg("")
			if err := m.errorHandler(err, s, i); err != nil {
				l.Error().Err(err).Msg("Could not respond to interaction")
			}
		}
	}
}

// DefaultErrorHandler is the default command error handler
func DefaultErrorHandler(err error, s *discordgo.Session, i *discordgo.InteractionCreate) error {
	msg := fmt.Sprintf("An error occurred: %v", err)

	if Responded(s, i) {
		_, err = s.InteractionResponseEdit(s.State.User.ID, i.Interaction, &discordgo.WebhookEdit{
			Content: msg,
		})
		return err
	}

	return s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: msg,
			Flags:   InteractionResponseEphemeral,
		},
	})
}

// Responded checks if the current interaction has been responded to
func Responded(s *discordgo.Session, i *discordgo.InteractionCreate) bool {
	msg, err := s.InteractionResponse(s.State.User.ID, i.Interaction)
	if err != nil {
		// a 404 is an expected error, so ignore those, but log everything else
		if r, ok := err.(*discordgo.RESTError); !ok || r.Response.StatusCode != 404 {
			log.Error().Err(err).Str("interaction", i.ID).Msg("Could not fetch interaction response")
		}
		return false
	}
	return msg.ID != ""
}
