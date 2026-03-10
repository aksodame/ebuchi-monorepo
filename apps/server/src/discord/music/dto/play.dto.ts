import {StringOption} from 'necord';

export class PlayDto {
  @StringOption({
    name: 'query',
    description: 'Song name, URL, or playlist URL',
    required: true,
  })
  query: string;
}
