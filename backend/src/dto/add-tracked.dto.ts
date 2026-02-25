import { ApiProperty } from '@nestjs/swagger';

export class AddTrackedDto {
    @ApiProperty({ example: '#1ABCDEFG' })
    tag!: string;

    @ApiProperty({ example: 'Brawler', required: false })
    name?: string;
}