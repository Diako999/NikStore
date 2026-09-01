import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(2, { message: 'متن کامنت باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(1000, { message: 'متن کامنت نباید بیشتر از ۱۰۰۰ کاراکتر باشد' })
  content: string;
}
