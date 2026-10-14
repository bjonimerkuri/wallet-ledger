"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryQueryDto = exports.CreateTransferDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateTransferDto {
}
exports.CreateTransferDto = CreateTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'friend@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "toEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1050,
        description: 'Amount in minor units (cents). Integers only — never floats.',
    }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTransferDto.prototype, "amount", void 0);
class HistoryQueryDto {
    constructor() {
        this.limit = 50;
    }
}
exports.HistoryQueryDto = HistoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50, minimum: 1, maximum: 200 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], HistoryQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-10-14T12:00:00.000Z',
        description: 'ISO timestamp cursor; returns transfers strictly older than this.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' ? undefined : value)),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], HistoryQueryDto.prototype, "before", void 0);
