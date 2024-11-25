import { Injectable } from '@nestjs/common';
import { Post } from 'common/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class I18nService {
  constructor() {
    // @InjectRepository(Post) private langRepository: Repository<Post>,
  }

  async getLang(lang: string) {
    // try {
    //   const user = await this.tokenService.verify(
    //     resetPasswordDto.reset_token,
    //     'RESET_PASSWORD',
    //   );
    //   user.password = resetPasswordDto.password;
    //   await user.save();
    // } catch (e) {
    //   throw new UnprocessableEntityException({ reset_token: e.message });
    // }
  }
}
