import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { calculateHaversineDistance } from '@carepath/utils';
import { FacilitySearchParamsSchema } from '@carepath/types';

export async function facilityRoutes(fastify: FastifyInstance) {
  // GET /facilities (Public geo search)
  fastify.get('/', async (request, reply) => {
    const params = FacilitySearchParamsSchema.parse(request.query);
    const { lat, lng, specialty, radiusKm, type } = params;

    const allFacilities = await prisma.facility.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(specialty ? { specialties: { has: specialty } } : {}),
      },
      include: {
        doctors: true,
      },
    });

    const withDistance = allFacilities
      .map((f) => {
        const distance = calculateHaversineDistance(lat, lng, f.locationLat, f.locationLng);
        return {
          ...f,
          distanceKm: distance,
          doctorCount: f.doctors.length,
        };
      })
      .filter((f) => f.distanceKm <= (radiusKm || 50))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return reply.send({
      success: true,
      count: withDistance.length,
      facilities: withDistance,
    });
  });

  // GET /facilities/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        doctors: { include: { user: true } },
      },
    });

    if (!facility) {
      return reply.status(404).send({ error: 'Not Found', message: 'Facility not found' });
    }

    return reply.send({ success: true, facility });
  });

  // GET /facilities/:id/doctors
  fastify.get('/:id/doctors', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { specialty } = request.query as { specialty?: string };

    const doctors = await prisma.doctor.findMany({
      where: {
        facilityId: id,
        ...(specialty ? { specialty } : {}),
      },
      include: { user: true },
    });

    return reply.send({ success: true, doctors });
  });
}
