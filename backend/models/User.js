// User Model
export const UserRoles = {
  NGO: 'ngo',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
};

export const UserSchema = {
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  role: { type: 'string', enum: Object.values(UserRoles), required: true },
  skills: { type: 'array', default: [] }, // For volunteers
  location: { type: 'object', default: { lat: 0, lng: 0, address: '' } },
  availability: { type: 'object', default: {} }, // For volunteers
  createdAt: { type: 'timestamp', default: 'now' },
  updatedAt: { type: 'timestamp', default: 'now' },
};
