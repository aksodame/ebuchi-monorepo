import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import {SlashCommandContext} from 'necord';
import {Observable} from 'rxjs';

@Injectable()
export class DeferReplyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<void>> {
    const [interaction] = context.getArgByIndex<SlashCommandContext>(0);
    await interaction.deferReply();

    return next.handle();
  }
}
