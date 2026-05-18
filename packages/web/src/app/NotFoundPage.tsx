import { Link } from 'react-router-dom';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';
import { t } from '@/lib/i18n';

/**
 * NotFoundPage — 404
 *
 * 對應 §23.3 ErrorState kind="404"。文案走「事實 + 下一步」、不哀求。
 */
export function NotFoundPage() {
  return (
    <>
      <PageHeader title={t('notFound.title')} back="/today" />
      <ErrorState
        kind="404"
        title={t('notFound.title')}
        description={t('notFound.description')}
        primaryAction={
          <Link to="/today">
            <Button variant="primary" size="md">
              {t('notFound.homeCta')}
            </Button>
          </Link>
        }
        secondaryAction={
          <Link to="/plans">
            <Button variant="ghost" size="sm">
              {t('notFound.plansCta')}
            </Button>
          </Link>
        }
        errorCode="HTTP 404"
        className="pt-12"
      />
    </>
  );
}
