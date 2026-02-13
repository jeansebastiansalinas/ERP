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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InvoicesService = class InvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateFromOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                client: true,
                product: true,
                invoice: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden no existe');
        }
        if (order.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Solo se pueden facturar órdenes aprobadas');
        }
        if (order.invoice) {
            throw new common_1.BadRequestException('Esta orden ya fue facturada');
        }
        return this.prisma.invoice.create({
            data: {
                orderId: order.id,
                clientName: order.client.businessName,
                productName: order.product.name,
                unitPrice: order.product.price,
                quantity: order.quantity,
                totalAmount: order.totalPrice,
            },
        });
    }
    async findAll() {
        return this.prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map