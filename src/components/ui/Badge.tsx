import { cn } from '@/utils/cn';
import type { SituacaoCapacidade } from '@/types';
import { SITUACAO_BADGE, SITUACAO_DOT } from '@/utils/constants';

export function SituationBadge({ situacao }: { situacao: SituacaoCapacidade }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        SITUACAO_BADGE[situacao],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', SITUACAO_DOT[situacao])} />
      {situacao}
    </span>
  );
}
