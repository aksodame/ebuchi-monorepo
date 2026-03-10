import {ExceptionHostHandler} from '@ebuchi-common/exception/exception-host-handler';
import {Injectable, Logger, type ArgumentsHost} from '@nestjs/common';
import {EmbedBuilder, type ChatInputCommandInteraction} from 'discord.js';

@Injectable()
export class DiscordHostHandler extends ExceptionHostHandler {
  private readonly logger = new Logger(DiscordHostHandler.name);

  canHandle(host: ArgumentsHost): boolean {
    return host.getType<string>() === 'necord';
  }

  async handle(exception: unknown, host: ArgumentsHost): Promise<void> {
    const [interaction] = host.getArgByIndex<[ChatInputCommandInteraction]>(0);
    if (!interaction) {
      return;
    }

    const embed = new EmbedBuilder().setColor(0xff0000).setDescription(this.getExceptionMessage(exception));

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({embeds: [embed]});
        return;
      }

      await interaction.reply({embeds: [embed], ephemeral: true});
    } catch {
      this.logger.error('Discord API caught an error while reporting the original exception');
    }
  }
}
