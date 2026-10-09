import { bodyClass, bulletClass, headingClass, listClass, sectionClass } from "./styles";

/** English translation of the privacy policy. The Japanese version governs. */
export function PrivacyPolicyEn() {
  return (
    <>
      <p className={bodyClass}>
        The operator of &ldquo;Sapporo Bites&rdquo; (the &ldquo;Service&rdquo;) has established this Privacy
        Policy regarding the handling of information about users of the Service, as set out below.
      </p>
      <p className={bodyClass}>
        This English version is a translation provided for convenience. If there is any discrepancy between this
        version and the Japanese version, the Japanese version shall prevail.
      </p>

      <section className={sectionClass}>
        <h2 className={headingClass}>1. Information We Collect</h2>
        <p className={bodyClass}>
          To provide the Service and to understand and improve how it is used, we may collect the following
          information.
        </p>
        <ol className={listClass}>
          <li>
            Information about access to and use of the Service
            <br />
            Pages viewed, date and time of access, hotel and restaurant pages used, filtering by area or tag, the
            language selected, and use of links to booking sites, maps, Instagram, phone calls, and similar.
          </li>
          <li>
            Session information
            <br />
            A random identifier generated to aggregate usage within a single session.
          </li>
          <li>
            Network information
            <br />
            A hash value generated from your IP address. The IP address itself is not stored in the Service&rsquo;s
            analytics database.
          </li>
          <li>
            Information about QR codes, etc.
            <br />
            Information identifying the QR code through which you accessed the Service, and similar.
          </li>
          <li>
            Language settings
            <br />
            We may use a cookie to store the display language you have selected.
          </li>
          <li>
            Technical information associated with providing the Service
            <br />
            In connection with hosting, delivery, security, and incident response for the Service, the cloud
            service providers we use may process technical information such as IP addresses, User-Agent, date and
            time of access, request information, and the region estimated from the IP address.
          </li>
        </ol>
        <p className={bodyClass}>
          The Service does not currently provide any function for general users to enter or register their name,
          address, phone number, email address, or similar information.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Purposes of Use</h2>
        <p className={bodyClass}>We use the information we collect for the following purposes.</p>
        <ol className={listClass}>
          <li>To provide and operate the Service</li>
          <li>
            To understand how the Service is used by aggregating page views, sessions, restaurant page views, use of
            links, and similar
          </li>
          <li>
            To analyze usage and improve the content, layout, search and filtering features, and other aspects of
            the Service
          </li>
          <li>
            To measure usage and referral effectiveness for each hotel, each listed restaurant, and each location
            where QR codes or similar are placed
          </li>
          <li>
            To report page views, clicks, and other usage results as statistical information to listed restaurants,
            hotels, and other businesses involved in the Service
          </li>
        </ol>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Retention Period</h2>
        <p className={bodyClass}>
          Usage information stored in the Service&rsquo;s analytics database is, as a rule, retained for 180 days from
          the date of collection and then deleted.
        </p>
        <p className={bodyClass}>
          The cookie used to store your display language is, as a rule, retained for up to one year. You can delete
          cookies through your browser settings.
        </p>
        <p className={bodyClass}>
          The session identifier is stored in your browser&rsquo;s session storage and, as a rule, is used until the
          session of that browser tab ends. Session identifiers recorded in the analytics database are, like other
          analytics information, retained for 180 days as a rule.
        </p>
        <p className={bodyClass}>
          Technical information processed by external providers for hosting, delivery, security, and incident
          response may be retained in accordance with each provider&rsquo;s service specifications, contract terms,
          and other rules.
        </p>
        <p className={bodyClass}>
          Except where retention is required by law or there is another reasonable ground, information that is no
          longer needed will be appropriately deleted.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Provision to Third Parties and Outsourcing</h2>
        <p className={bodyClass}>
          The operator will not provide information about users to third parties without the user&rsquo;s consent,
          except where required or permitted by law.
        </p>
        <p className={bodyClass}>
          To the extent necessary to provide and operate the Service, we may entrust the handling of information to
          cloud services and other external providers. We currently use mainly the following services.
        </p>
        <ul className={bulletClass}>
          <li>Vercel: hosting and delivery of the Service</li>
          <li>Supabase: database and data storage</li>
        </ul>
        <p className={bodyClass}>
          When using external providers, the operator will endeavor to ensure that necessary and appropriate
          security management is carried out according to the nature of the information handled and the purposes of
          use.
        </p>
        <p className={bodyClass}>
          When reporting usage to listed restaurants, hotels, or other related businesses, we will, as a rule,
          provide aggregated and statistical information such as page views and clicks, and will not provide
          information intended to identify specific users.
        </p>
        <p className={bodyClass}>
          Information may be handled outside Japan in connection with the cloud services we use. In such cases, the
          operator will endeavor to ensure appropriate handling through contracts and other necessary measures in
          accordance with applicable laws, and will provide information about those measures where required by law.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Security Measures</h2>
        <p className={bodyClass}>
          The operator takes necessary and appropriate security measures, suited to the nature of the information
          and the scale of the Service, to prevent leakage, loss, damage, unauthorized access, and other risks
          concerning information handled by the Service.
        </p>
        <p className={bodyClass}>
          Specifically, we implement technical measures such as appropriate management of access rights, encryption
          of communications, restriction and validation of input data, and proper management of secrets within the
          system.
        </p>
        <p className={bodyClass}>
          In our analytics, we do not store IP addresses themselves in the analytics database but use hashed values,
          and we limit the information collected to what is necessary to operate the Service and analyze its usage.
        </p>
        <p className={bodyClass}>
          We also set a retention period for stored analytics information and delete it after that period, so that
          information is not kept longer than necessary.
        </p>
        <p className={bodyClass}>
          When entrusting the handling of information to external providers, we will endeavor to check their
          security management systems and to supervise them as necessary and appropriate.
        </p>
        <p className={bodyClass}>
          In the event of a leak or similar incident, we will confirm the facts, prevent further damage, and take
          other necessary actions, and where required by law, will report to the relevant authorities and notify
          the affected individuals.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Use of Cookies and Browser Storage</h2>
        <p className={bodyClass}>
          To improve convenience for users and understand how the Service is used, the Service uses cookies and the
          browser&rsquo;s session storage.
        </p>
        <ol className={listClass}>
          <li>
            Language cookie
            <br />
            We use a cookie so that the display language you selected is applied on your next visit. This cookie is,
            as a rule, retained for up to one year.
          </li>
          <li>
            Session storage
            <br />
            To aggregate usage within a single session, we store a randomly generated identifier in your
            browser&rsquo;s session storage. This identifier does not contain your name, email address, or any other
            information that directly identifies you.
          </li>
        </ol>
        <p className={bodyClass}>
          You can delete cookies through your browser settings. If you delete cookies, your display language setting
          may no longer be retained.
        </p>
        <p className={bodyClass}>
          At present, the Service does not use cookies for advertising, nor tracking cookies from third-party
          advertising or analytics services.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Transmission of User Information</h2>
        <p className={bodyClass}>
          To understand usage, improve the Service, and measure referral effectiveness, the following information
          may be sent from your device to the Service&rsquo;s servers.
        </p>
        <ul className={bulletClass}>
          <li>A randomly generated session identifier</li>
          <li>Information about the pages viewed</li>
          <li>
            Actions such as page views, restaurant views, filtering, and selection of external links
          </li>
          <li>Information identifying the hotel, restaurant, area, tag, etc. used</li>
          <li>The display language selected</li>
          <li>Information identifying the QR code</li>
          <li>Other information necessary to understand how the Service is used</li>
        </ul>
        <p className={bodyClass}>
          This information is used to provide and operate the Service, analyze usage, improve the Service, and
          measure referral effectiveness for hotels, listed restaurants, and others.
        </p>
        <p className={bodyClass}>
          This information may be processed through the hosting services and other services used by the Service.
        </p>
        <p className={bodyClass}>
          At present, the Service does not embed Google Maps, Instagram, booking services, or other external
          services in its pages in a way that automatically sends user information to those services before the user
          chooses to use them.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. External Services and Links</h2>
        <p className={bodyClass}>
          The Service may contain links to Google Maps, Instagram, restaurant booking services, and other external
          websites or services.
        </p>
        <p className={bodyClass}>
          Once you follow such a link to an external service, the handling of information is governed by that
          service&rsquo;s privacy policy and other terms.
        </p>
        <p className={bodyClass}>
          The operator is not responsible for the handling of information by external services. When using an
          external service, please review its privacy policy and other terms as needed.
        </p>
        <p className={bodyClass}>
          At present, the Service does not automatically send user information by embedding external services such
          as Google Maps or Instagram in its pages.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>9. Disclosure, Correction, Suspension of Use, etc.</h2>
        <p className={bodyClass}>
          To the extent provided by law, users may request disclosure, correction, addition, deletion, suspension of
          use, erasure, or other actions permitted by law regarding personal data about themselves held by the
          operator.
        </p>
        <p className={bodyClass}>
          Upon receiving such a request, the operator will verify that the requester is the individual concerned and
          respond appropriately in accordance with applicable laws.
        </p>
        <p className={bodyClass}>
          However, the Service does not provide any function to register general users&rsquo; names, addresses, phone
          numbers, email addresses, or similar, and as a rule does not hold information in its analytics that
          directly identifies users. We may therefore be unable to respond to a request if we cannot identify the
          information concerned, cannot verify the requester&rsquo;s identity, or the information is not subject to
          disclosure or other requests under the law.
        </p>
        <p className={bodyClass}>
          For inquiries regarding disclosure and similar requests, please contact the operator&rsquo;s inquiry
          contact.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>10. Changes to This Privacy Policy</h2>
        <p className={bodyClass}>
          The operator may change this Privacy Policy as necessary, such as in response to changes in laws, the
          content of the Service, or the external services used.
        </p>
        <p className={bodyClass}>
          When making significant changes, we will notify users by posting on the Service or by other appropriate
          means.
        </p>
        <p className={bodyClass}>The revised Privacy Policy takes effect when it is posted on the Service.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>11. Operator and Contact</h2>
        <dl className="mt-3 space-y-1.5 text-sm leading-relaxed text-(--color-ink)">
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">Operator:</dt>
            <dd>BLANCO Co., Ltd. (株式会社BLANCO)</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">Address:</dt>
            <dd>5-9, Maeda 5-jo 10-chome, Teine-ku, Sapporo, Hokkaido, Japan</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">Representative:</dt>
            <dd>Osamu Katayama, Representative Director</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">Inquiries and complaints:</dt>
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
            <dt className="shrink-0 text-(--color-ink-soft)">Established:</dt>
            <dd>September 26, 2026</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--color-ink-soft)">Published:</dt>
            <dd>September 26, 2026</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
