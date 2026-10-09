import { bodyClass, bulletClass, headingClass, listClass, sectionClass } from "./styles";

/** 日本語版（正本）。 */
export function PrivacyPolicyJa() {
  return (
    <>
      <p className={bodyClass}>
        本サービス運営者は、「Sapporo Bites」（以下「本サービス」といいます。）における利用者に関する情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
      </p>

      <section className={sectionClass}>
        <h2 className={headingClass}>1. 取得する情報</h2>
        <p className={bodyClass}>
          本サービスでは、サービスの提供、利用状況の把握および改善のため、以下の情報を取得することがあります。
        </p>
        <ol className={listClass}>
          <li>
            本サービスへのアクセスおよび利用に関する情報
            <br />
            閲覧したページ、アクセス日時、利用したホテルページ・店舗ページ、エリア・タグによる絞り込み、選択した言語、予約サイト・地図・Instagram・電話等へのリンクの利用状況。
          </li>
          <li>
            セッションに関する情報
            <br />
            同一の利用セッション内での利用状況を集計するために生成するランダムな識別子
          </li>
          <li>
            ネットワークに関する情報
            <br />
            IPアドレスをもとに生成したハッシュ値。IPアドレスそのものは、当サービスのアクセス解析用データベースには保存しません。
          </li>
          <li>
            QRコード等に関する情報
            <br />
            アクセス元となったQRコードを識別するための情報など
          </li>
          <li>
            言語設定に関する情報
            <br />
            利用者が選択した表示言語を保存するため、Cookieを使用することがあります。
          </li>
          <li>
            サービス提供に伴う技術情報
            <br />
            本サービスのホスティング、配信、セキュリティ確保、障害対応等に伴い、利用するクラウドサービス事業者において、IPアドレス、User-Agent、アクセス日時、リクエスト情報、IPアドレスから推定される地域その他の技術情報が処理される場合があります。
          </li>
        </ol>
        <p className={bodyClass}>
          本サービスでは、利用者の氏名、住所、電話番号、メールアドレス等を、一般利用者から直接入力・登録させる機能は現在提供していません。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. 取得した情報の利用目的</h2>
        <p className={bodyClass}>本サービスでは、取得した情報を以下の目的で利用します。</p>
        <ol className={listClass}>
          <li>本サービスの提供および運営のため</li>
          <li>閲覧数、利用セッション数、店舗ページの閲覧状況、各種リンクの利用状況等を集計し、本サービスの利用状況を把握するため</li>
          <li>利用状況を分析し、掲載内容、画面構成、検索・絞り込み機能その他本サービスの改善に役立てるため</li>
          <li>ホテルごと、掲載店舗ごと、QRコード等の設置場所ごとの利用状況および送客効果を測定するため</li>
          <li>掲載店舗、ホテルその他本サービスの関係事業者に対し、閲覧数、クリック数その他の利用実績を統計的な情報として報告するため</li>
        </ol>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. 情報の保存期間</h2>
        <p className={bodyClass}>
          本サービスのアクセス解析用データベースに保存される利用情報は、原則として取得日から180日間保存し、その後削除します。
        </p>
        <p className={bodyClass}>
          表示言語の設定を保存するために使用するCookieは、原則として最大1年間保存されます。利用者は、ブラウザの設定等によりCookieを削除することができます。
        </p>
        <p className={bodyClass}>
          セッション識別子は、ブラウザのセッションストレージを利用して保存され、原則として当該ブラウザタブのセッション終了まで使用されます。アクセス解析用データベースに記録されたセッション識別子については、他のアクセス解析情報と同様に原則180日間保存します。
        </p>
        <p className={bodyClass}>
          本サービスのホスティング、配信、セキュリティ確保、障害対応等のために外部事業者が処理する技術情報については、各事業者のサービス仕様、契約内容その他の定めに従って保持される場合があります。
        </p>
        <p className={bodyClass}>
          なお、法令上保存が必要な場合その他合理的な理由がある場合を除き、利用する必要がなくなった情報は適切に削除します。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. 第三者提供および外部委託</h2>
        <p className={bodyClass}>
          本サービス運営者は、法令に基づく場合その他法令上認められる場合を除き、利用者に関する情報を、利用者本人の同意なく第三者に提供しません。
        </p>
        <p className={bodyClass}>
          本サービスでは、サービスの提供および運営に必要な範囲で、クラウドサービスその他の外部事業者に情報の取扱いを委託することがあります。現在、主に以下のサービスを利用しています。
        </p>
        <ul className={bulletClass}>
          <li>Vercel：本サービスのホスティングおよび配信</li>
          <li>Supabase：データベースおよびデータストレージ</li>
        </ul>
        <p className={bodyClass}>
          外部事業者を利用する場合、本サービス運営者は、取扱う情報の内容および利用目的に応じ、必要かつ適切な安全管理が行われるよう努めます。
        </p>
        <p className={bodyClass}>
          また、掲載店舗、ホテルその他の関係事業者に利用状況を報告する場合は、原則として閲覧数、クリック数その他の集計・統計情報を提供し、特定の利用者を識別することを目的とした情報の提供は行いません。
        </p>
        <p className={bodyClass}>
          なお、利用するクラウドサービス等の提供に伴い、情報が日本国外で取り扱われる場合があります。この場合、本サービス運営者は、適用される法令に従い、契約その他必要な措置により適切な取扱いの確保に努めます。また、法令に基づき必要な場合には、当該措置に関する情報を提供します。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. 安全管理措置</h2>
        <p className={bodyClass}>
          本サービス運営者は、本サービスで取り扱う情報について、漏えい、滅失、毀損、不正アクセスその他のリスクを防止するため、取扱う情報の性質および本サービスの規模に応じて、必要かつ適切な安全管理措置を講じます。
        </p>
        <p className={bodyClass}>
          具体的には、アクセス権限の適切な管理、通信の暗号化、入力データの制限および検証、システム上の秘密情報の適切な管理等の技術的措置を実施します。
        </p>
        <p className={bodyClass}>
          また、アクセス解析においては、IPアドレスそのものを解析用データベースに保存せず、ハッシュ化した値を利用するほか、取得する情報をサービスの運営および利用状況の分析に必要な範囲に限定します。
        </p>
        <p className={bodyClass}>
          保存するアクセス解析情報についても保存期間を定め、期間経過後に削除するなど、情報を必要以上に保持しないよう管理します。
        </p>
        <p className={bodyClass}>
          外部事業者に情報の取扱いを委託する場合には、当該事業者の安全管理体制等を確認し、必要かつ適切な監督を行うよう努めます。
        </p>
        <p className={bodyClass}>
          情報の漏えい等が発生した場合には、事実関係の確認、被害拡大の防止その他必要な対応を行い、法令上必要な場合には、関係機関への報告および本人への通知等を行います。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Cookieおよびブラウザストレージの利用</h2>
        <p className={bodyClass}>
          本サービスでは、利用者の利便性向上および利用状況の把握のため、Cookieおよびブラウザのセッションストレージを使用します。
        </p>
        <ol className={listClass}>
          <li>
            言語設定用Cookie
            <br />
            利用者が選択した表示言語を次回以降のアクセス時にも反映するため、Cookieを使用します。このCookieの保存期間は原則として最大1年間です。
          </li>
          <li>
            セッションストレージ
            <br />
            同一の利用セッション内での利用状況を集計するため、ランダムに生成した識別子をブラウザのセッションストレージに保存します。この識別子は、氏名、メールアドレスその他利用者を直接特定する情報を含みません。
          </li>
        </ol>
        <p className={bodyClass}>
          利用者は、ブラウザの設定によりCookieの削除等を行うことができます。Cookieを削除した場合、表示言語の設定が保持されなくなる場合があります。
        </p>
        <p className={bodyClass}>
          本サービスでは、現時点において、広告配信を目的としたCookieや、第三者の広告・アクセス解析サービスによるトラッキングCookieは使用していません。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. 利用者情報の送信</h2>
        <p className={bodyClass}>
          本サービスでは、利用状況の把握、サービスの改善および送客効果の測定のため、利用者の端末から本サービスのサーバーに以下の情報を送信することがあります。
        </p>
        <ul className={bulletClass}>
          <li>ランダムに生成されたセッション識別子</li>
          <li>閲覧したページに関する情報</li>
          <li>ページ閲覧、店舗閲覧、絞り込み、外部リンクの選択等の操作情報</li>
          <li>利用したホテル、店舗、エリア、タグ等を識別する情報</li>
          <li>選択した表示言語</li>
          <li>QRコードを識別する情報</li>
          <li>その他、本サービスの利用状況を把握するために必要な情報</li>
        </ul>
        <p className={bodyClass}>
          これらの情報は、本サービスの提供および運営、利用状況の分析、サービス改善ならびにホテル・掲載店舗等への送客効果の測定を目的として利用します。
        </p>
        <p className={bodyClass}>
          これらの情報は、本サービスが利用するホスティングサービス等を通じて処理される場合があります。
        </p>
        <p className={bodyClass}>
          なお、本サービスでは、現時点において、Google Maps、Instagram、予約サービスその他の外部サービスを本サービスのページに埋め込むことによって、利用者が当該サービスを選択する前に、これらの外部サービスへ利用者情報を自動送信する仕組みは利用していません。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. 外部サービスおよび外部リンク</h2>
        <p className={bodyClass}>
          本サービスには、Google Maps、Instagram、飲食店の予約サービスその他の外部ウェブサイトまたはサービスへのリンクが含まれる場合があります。
        </p>
        <p className={bodyClass}>
          利用者がこれらのリンクを選択して外部サービスへ移動した後の情報の取扱いについては、各外部サービスのプライバシーポリシーその他の規定が適用されます。
        </p>
        <p className={bodyClass}>
          本サービス運営者は、外部サービスにおける情報の取扱いについて責任を負うものではありません。外部サービスを利用する際は、必要に応じて各サービスのプライバシーポリシー等をご確認ください。
        </p>
        <p className={bodyClass}>
          なお、本サービスでは、現時点において、Google Maps、Instagram等の外部サービスを本サービスのページに埋め込むことによる利用者情報の自動送信は行っていません。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>9. 開示・訂正・利用停止等</h2>
        <p className={bodyClass}>
          利用者は、法令に定める範囲において、本サービス運営者が保有する自己に関する個人データについて、開示、訂正、追加、削除、利用停止、消去その他法令上認められる請求を行うことができます。
        </p>
        <p className={bodyClass}>
          これらの請求があった場合、本サービス運営者は、請求者が本人であることを確認した上で、適用される法令に従い適切に対応します。
        </p>
        <p className={bodyClass}>
          ただし、本サービスでは一般利用者の氏名、住所、電話番号、メールアドレス等を登録する機能を提供しておらず、アクセス解析情報についても利用者を直接特定する情報を原則として保持していません。そのため、請求対象となる情報を特定できない場合、本人であることを確認できない場合、または対象となる情報が法令上の開示等の対象に該当しない場合には、ご要望に対応できないことがあります。
        </p>
        <p className={bodyClass}>開示等に関するお問い合わせは、本サービス運営者の問い合わせ窓口までご連絡ください。</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>10. プライバシーポリシーの変更</h2>
        <p className={bodyClass}>
          本サービス運営者は、法令の改正、本サービスの内容の変更、利用する外部サービスの変更その他必要に応じて、本プライバシーポリシーを変更することがあります。
        </p>
        <p className={bodyClass}>重要な変更を行う場合は、本サービス上への掲載その他適切な方法により利用者に周知します。</p>
        <p className={bodyClass}>変更後のプライバシーポリシーは、本サービス上に掲載した時点から適用されます。</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>11. 運営者およびお問い合わせ窓口</h2>
        <dl className="mt-3 space-y-1.5 text-sm leading-relaxed text-(--color-ink)">
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">運営者名称：</dt>
            <dd>株式会社BLANCO</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">所在地：</dt>
            <dd>北海道札幌市手稲区前田5条10丁目5-9</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">代表者：</dt>
            <dd>代表取締役 片山 修</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">お問い合わせ・苦情申出先：</dt>
            <dd>
              <a
                href="mailto:kurosawa@japan-blanco.com"
                className="text-(--color-coral-deep) underline underline-offset-2"
              >
                kurosawa@japan-blanco.com
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">制定日：</dt>
            <dd>2026年9月26日</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">公開日：</dt>
            <dd>2026年9月26日</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
