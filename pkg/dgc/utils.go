package dgc

import "github.com/bwmarrin/discordgo"

// GetUser returns the user that created the interaction either in a DM or guild
func GetUser(i *discordgo.InteractionCreate) *discordgo.User {
	if i.Member != nil {
		return i.Member.User
	}

	return i.User
}
