import {NumberOption} from 'necord';

export class VolumeDto {
  @NumberOption({
    name: 'level',
    description: 'Volume level (0-150)',
    required: true,
    min_value: 0,
    max_value: 150,
  })
  level: number;
}
