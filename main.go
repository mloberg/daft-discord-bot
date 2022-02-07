package main

import (
	"fmt"
	"os"

	"github.com/bwmarrin/dgvoice"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/mloberg/daft-discord-bot/cli"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	dgvoice.OnError = func(str string, err error) {
		log.Error().Err(err).Str("component", "dgVoice").Msg(str)
	}

	if err := cli.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
