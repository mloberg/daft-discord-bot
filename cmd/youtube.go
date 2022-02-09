package cmd

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"

	"github.com/mloberg/daft-discord-bot/internal/player"
	"github.com/mloberg/daft-discord-bot/pkg/dgc"
)

var ytCmd = &dgc.Command{
	Name:        "youtube",
	Description: "Play YouTube video",
	Options: []*discordgo.ApplicationCommandOption{
		{
			Type:        discordgo.ApplicationCommandOptionString,
			Name:        "url",
			Description: "YouTube Video URL or ID",
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

		vs, err := s.State.VoiceState(i.GuildID, i.Member.User.ID)
		if err != nil {
			return fmt.Errorf("could not find voice channel to join")
		}

		// if given a playlist, it can take a while to get all the urls
		// let the user know we're working on it so the interaction doesn't time out
		err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Parsing YouTube video. This may take a few minutes.",
				Flags:   dgc.InteractionResponseEphemeral,
			},
		})
		if err != nil {
			return err
		}

		// if this is a playlist, this could take some time
		id := i.ApplicationCommandData().Options[0].StringValue()
		urls, err := getVideoURLs(id)
		if err != nil {
			log.Error().Err(err).Msg("Error from youtube-dl")
			return fmt.Errorf("could not play %s", id)
		}

		// it's been a while, make sure another playlist hasn't been started
		if players[i.GuildID] != nil {
			return fmt.Errorf("already playing in this guild")
		}

		vc, err := s.ChannelVoiceJoin(vs.GuildID, vs.ChannelID, false, true)
		if err != nil {
			return err
		}

		players[i.GuildID] = player.NewPlayer(urls)
		go func() {
			if err := players[vc.GuildID].Play(vc); err != nil {
				log.Error().Err(err).Str("guild", vc.GuildID).Msg("")
			}
			players[i.GuildID] = nil
		}()

		_, err = s.FollowupMessageCreate(s.State.User.ID, i.Interaction, false, &discordgo.WebhookParams{
			Content: fmt.Sprintf("Playing %s", id),
			Flags:   dgc.InteractionResponseEphemeral,
		})
		return err
	},
}

func init() {
	commands.AddCommand(ytCmd)
}

func getVideoURLs(id string) ([]string, error) {
	var out bytes.Buffer
	var serr bytes.Buffer

	// worstaudio sounds good enough for streaming and doesn't produce much lag
	ytdl := exec.Command("youtube-dl", "--get-url", "-f", "worstaudio[acodec=opus]", id)
	ytdl.Stdout = &out
	ytdl.Stderr = &serr

	if err := ytdl.Run(); err != nil {
		return []string{}, fmt.Errorf("%w: %s", err, serr.String())
	}

	return strings.Split(out.String(), "\n"), nil
}
