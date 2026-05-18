import { Link } from 'react-router-dom';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';

/**
 * NotFoundPage — 404
 *
 * 對應 §23.3 ErrorState kind="404"。文案走「事實 + 下一步」、不哀求。
 */
export function NotFoundPage() {
  return (
    <>
      <PageHeader title="找不到頁面" back="/today" />
      <ErrorState
        kind="404"
        title="找不到這個頁面"
        description="可能是連結舊了、或這個頁面還沒實作。回首頁從頭開始吧。"
        primaryAction={
          <Link to="/today">
            <Button variant="primary" size="md">
              回首頁
            </Button>
          </Link>
        }
        secondaryAction={
          <Link to="/plans">
            <Button variant="ghost" size="sm">
              或看看課表
            </Button>
          </Link>
        }
        errorCode="HTTP 404"
        className="pt-12"
      />
    </>
  );
}
