import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { Status } from "../../../prisma/generated/prisma/enums";

type MedresaInput = {
  name: string;
  location: string;
  phone?: string | null;
};

const medresaListSelect = {
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
} as const;

export const getMedresas = async () => {
  return prisma.medresa.findMany({
    where: {
      deleted_at: null,
    },
    select: medresaListSelect,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getMedresaDetail = async (id: string) => {
  return prisma.medresa.findFirst({
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

export const deactivateMedresa = async (id: string, performedBy: string) => {
  const existing = await prisma.medresa.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return null;
  if (existing.status === Status.INACTIVE) {
    return existing;
  }

  const medresa = await prisma.medresa.update({
    where: { id },
    data: { status: Status.INACTIVE },
    select: medresaListSelect,
  });

  await auditLog({
    tableName: "Medresa",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "DEACTIVATE", status: Status.INACTIVE },
  });

  return medresa;
};

export const reactivateMedresa = async (id: string, performedBy: string) => {
  const existing = await prisma.medresa.findFirst({
    where: { id },
  });

  if (!existing) return null;

  const medresa = await prisma.medresa.update({
    where: { id },
    data: {
      status: Status.ACTIVE,
      deleted_at: null,
    },
    select: medresaListSelect,
  });

  await auditLog({
    tableName: "Medresa",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "REACTIVATE", status: Status.ACTIVE },
  });

  return medresa;
};
