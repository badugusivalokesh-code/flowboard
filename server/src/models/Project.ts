import { Schema, model, Document, Types } from 'mongoose';

export type ProjectStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'todo',
  'in_progress',
  'completed',
  'overdue',
];

export interface IProject extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 1,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'todo',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ owner: 1, updatedAt: -1 });
projectSchema.index({ owner: 1, status: 1 });

export const Project = model<IProject>('Project', projectSchema);
