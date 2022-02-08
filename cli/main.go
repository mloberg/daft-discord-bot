package cli

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"

	slash "github.com/mloberg/daft-discord-bot/cmd"
)

var (
	dg      *discordgo.Session
	intents = discordgo.IntentsGuilds | discordgo.IntentsGuildMessages | discordgo.IntentsGuildVoiceStates
	rootCmd = &cobra.Command{
		Use:   "daft",
		Short: "Start Discord bot",
		PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
			token, err := cmd.Flags().GetString("token")
			if err != nil {
				return err
			}

			dg, err = discordgo.New("Bot " + token)
			return err
		},
		PersistentPostRunE: func(cmd *cobra.Command, args []string) error {
			return dg.Close()
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			dg.AddHandler(slash.Handler())
			dg.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
				log.Info().Msg("Bot is running")
				if err := s.UpdateGameStatus(0, "🎶 music 🎶"); err != nil {
					log.Error().Err(err).Msg("Could not set bot status")
				}
			})

			dg.Identify.Intents = intents
			if err := dg.Open(); err != nil {
				return err
			}

			stop := make(chan os.Signal, 1)
			signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
			<-stop

			return nil
		},
	}
)

func init() {
	rootCmd.PersistentFlags().StringP("token", "t", os.Getenv("BOT_TOKEN"), "Discord Bot Token")
}

func Execute() error {
	return rootCmd.Execute()
}
