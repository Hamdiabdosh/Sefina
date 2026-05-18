import { prisma } from "../../lib/prisma";
import { Status } from "../../../prisma/generated/prisma/enums";

type MedresaInput = {
  name: string;
  location: string;
  phone?: string | null;
};

export const getMedresas = async () => {
  return prisma.medresa.findMany({
    where: {
      deleted_at: null,
    },
    select: {
      id: true,
      name: true,
      location: true,
      phone: true,
      status: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          students: true,
          teacher_medresas: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getMedresaDetail = async (id: string) => {
  return prisma.medresa.findUnique({
    where: {
      id,
      deleted_at: null,
    },
    select: {
      id: true,
      name: true,
      location: true,
      phone: true,
      status: true,
      created_at: true,
      updated_at: true,
      students: {
        where: {
          deleted_at: null,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      },
      teacher_medresas: {
        where: {
          deleted_at: null,
        },
        select: {
          id: true,
          teacher: {
            select: {
              id: true,
              full_name: true,
            },
          },
          role: true,
        },
      },
      medresa_courses: {
        where: {
          deleted_at: null,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      },
    },
  });
};

export const createMedresa = async (data: MedresaInput) => {
  return prisma.medresa.create({
    data: {
      name: data.name,
      location: data.location,
      phone: data.phone ?? null,
      status: Status.ACTIVE,
    },
  });
};

export const updateMedresa = async (id: string, data: MedresaInput) => {
  return prisma.medresa.update({
    where: {
      id,
      deleted_at: null,
    },
    data: {
      name: data.name,
      location: data.location,
      phone: data.phone ?? null,
      updated_at: new Date(),
    },
  });
};

export const deleteMedresa = async (id: string) => {
  return prisma.medresa.update({
    where: {
      id,
      deleted_at: null,
    },
    data: {
      status: Status.INACTIVE,
      deleted_at: new Date(),
    },
  });
};