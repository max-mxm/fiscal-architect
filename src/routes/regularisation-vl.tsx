import { createFileRoute } from '@tanstack/react-router';
import { VLRegularization } from '~/pages/VLRegularization';

export const Route = createFileRoute('/regularisation-vl')({
  component: VLRegularization,
});
