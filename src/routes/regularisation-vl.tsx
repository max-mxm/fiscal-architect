import { createFileRoute } from '@tanstack/react-router';
import { VLRegularizationScreen } from '~/screens/VLRegularizationScreen';

export const Route = createFileRoute('/regularisation-vl')({
  component: VLRegularizationScreen,
});
