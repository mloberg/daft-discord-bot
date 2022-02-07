package player

import (
	"github.com/bwmarrin/dgvoice"
	"github.com/bwmarrin/discordgo"
)

type Player struct {
	stop     chan bool
	current  string
	playlist []string
}

func NewPlayer(songs []string) *Player {
	return &Player{
		stop:     make(chan bool),
		playlist: songs,
	}
}

func (p *Player) Play(v *discordgo.VoiceConnection) error {
	if len(p.playlist) == 0 {
		return v.Disconnect()
	}

	p.current = p.playlist[0]
	p.playlist = p.playlist[1:]
	p.stop = make(chan bool)

	dgvoice.PlayAudioFile(v, p.current, p.stop)
	close(p.stop)

	return p.Play(v)
}

func (p *Player) Stop() {
	p.playlist = []string{}
	p.stop <- true
}

func (p *Player) Next() {
	p.stop <- true
}
