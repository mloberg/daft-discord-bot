package cli

import (
	"github.com/spf13/cobra"

	slash "github.com/mloberg/daft-discord-bot/cmd"
)

var installCmd = &cobra.Command{
	Use:   "install [guid]",
	Args:  cobra.MaximumNArgs(1),
	Short: "Install Slash commands",
	RunE: func(cmd *cobra.Command, args []string) error {
		guild := ""
		if len(args) == 1 {
			guild = args[0]
		}

		dg.Identify.Intents = intents
		if err := dg.Open(); err != nil {
			return err
		}

		return slash.Install(dg, guild)
	},
}

func init() {
	rootCmd.AddCommand(installCmd)
}
