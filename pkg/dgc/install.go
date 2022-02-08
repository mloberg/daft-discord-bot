package dgc

import (
	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

// Install creates the commands in given guild. If guild is empty, it will install
// the commands globally.
func (m *Commander) Install(s *discordgo.Session, guild string) error {
	commands := []*discordgo.ApplicationCommand{}
	for _, c := range m.commands {
		commands = append(commands, &discordgo.ApplicationCommand{
			Name:        c.Name,
			Description: c.Description,
			Options:     c.Options,
		})
	}

	_, err := s.ApplicationCommandBulkOverwrite(s.State.User.ID, guild, commands)
	return err
}

// Uninstall removes the commands in given guild. If guild is empty, it will remove
// the commands globally.
func (m *Commander) Uninstall(s *discordgo.Session, guild string) error {
	cmds, err := s.ApplicationCommands(s.State.User.ID, guild)
	if err != nil {
		return err
	}

	for _, c := range cmds {
		log.Debug().Str("command", c.Name).Str("guild", guild).Str("id", c.ID).Msg("Uninstalling command")

		if err := s.ApplicationCommandDelete(c.ApplicationID, guild, c.ID); err != nil {
			return err
		}
	}

	return nil
}
