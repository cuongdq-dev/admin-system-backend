import { UserParam } from '@app/decorators';
import { Customer } from '@app/entities';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CustomerUpdateDto } from './customer.dto';
import { CustomerService } from './customer.service';

@ApiTags('Customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get('/me')
  @ApiOperation({ summary: 'get logged in customer details' })
  async me(@UserParam() customer: Customer) {
    return customer;
  }

  @Patch('/me')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update logged in customer',
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'update logged in customer',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @UserParam() customer: Customer,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() updateDto: CustomerUpdateDto,
  ) {
    return this.customerService.update(customer, avatar, updateDto);
  }
}
