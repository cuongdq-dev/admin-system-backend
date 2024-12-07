import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { AuthGuard } from '@nestjs/passport';
import { addressPaginateConfig } from './address.pagination';
import { Address } from '@app/entities';
import { ControllerFactory } from '@app/crud/crud.controller';

@ApiTags('Address')
@Controller({
  path: 'addresses',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class AddressController extends ControllerFactory({
  entity: Address,
  paginateConfig: addressPaginateConfig,
  createFields: [
    'name',
    'address',
    'city',
    'country',
    'first_name',
    'last_name',
    'state',
    'zip_code',
  ],
  updatedFileds: [
    'name',
    'address',
    'city',
    'country',
    'first_name',
    'last_name',
    'state',
    'zip_code',
  ],
}) {
  constructor(private service: AddressService) {
    super();
  }
}
