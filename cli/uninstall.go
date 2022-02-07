package cli

import (
	"github.com/spf13/cobra"

	slash "github.com/mloberg/daft-discord-bot/cmd"
)

var uninstallCmd = &cobra.Command{
	Use:     "uninstall [guid]",
	Aliases: []string{"remove"},
	Args:    cobra.MaximumNArgs(1),
	Short:   "Uninstall Slash commands",
	RunE: func(cmd *cobra.Command, args []string) error {
		guild := ""
		if len(args) == 1 {
			guild = args[0]
		}

		dg.Identify.Intents = intents
		if err := dg.Open(); err != nil {
			return err
		}

		return slash.Uninstall(dg, guild)
	},
}

func init() {
	rootCmd.AddCommand(uninstallCmd)
}
