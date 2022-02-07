package cmd

import (
	"github.com/bwmarrin/discordgo"

	"github.com/mloberg/daft-discord-bot/pkg/dgc"
)

var commands = dgc.NewCommander()

func Handler() func(s *discordgo.Session, i *discordgo.InteractionCreate) {
	return commands.Handler
}

func Install(s *discordgo.Session, guild string) error {
	return commands.Install(s, guild)
}

func Uninstall(s *discordgo.Session, guild string) error {
	return commands.Uninstall(s, guild)
}
