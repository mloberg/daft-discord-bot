package cmd

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/bwmarrin/discordgo"

	"github.com/mloberg/daft-discord-bot/internal/player"
	"github.com/mloberg/daft-discord-bot/pkg/dgc"
)

var (
	players = map[string]*player.Player{}
	playCmd = &dgc.Command{
		Name:        "play",
		Description: "Play some music",
		Options: []*discordgo.ApplicationCommandOption{
			{
				Type:        discordgo.ApplicationCommandOptionString,
				Name:        "playlist",
				Description: "Playlist to start",
				Required:    true,
			},
		},
		Run: func(s *discordgo.Session, i *discordgo.InteractionCreate) error {
			if i.GuildID == "" {
				return fmt.Errorf("cannot start music from a DM")
			}

			if players[i.GuildID] != nil {
				return fmt.Errorf("already playing in this guild")
			}

			songs := []string{}
			name := i.ApplicationCommandData().Options[0].StringValue()
			files, err := os.ReadDir(name)
			if err != nil {
				return fmt.Errorf("could not load songs for %s: %v", name, err)
			}
			for _, f := range files {
				if !f.IsDir() && !strings.HasPrefix(f.Name(), ".") {
					songs = append(songs, path.Join(name, f.Name()))
				}
			}

			vs, err := s.State.VoiceState(i.GuildID, i.Member.User.ID)
			if err != nil {
				return fmt.Errorf("could not find voice channel to join")
			}

			vc, err := s.ChannelVoiceJoin(vs.GuildID, vs.ChannelID, false, true)
			if err != nil {
				return err
			}

			players[i.GuildID] = player.NewPlayer(songs)
			go func() {
				players[i.GuildID].Play(vc) //nolint:errcheck
				players[i.GuildID] = nil
			}()

			return s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Started playlist %s", name),
				},
			})
		},
	}
)

func init() {
	commands.AddCommand(playCmd)
}
