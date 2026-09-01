import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchSuggestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  q: string;
}
