export default function PrivacyPolicyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white px-6 py-12 font-sans text-zinc-900">
            <main className="mx-auto w-full max-w-2xl">
                <h1 className="mb-6 text-3xl font-bold">Politique de confidentialité</h1>

                <p className="mb-4 text-zinc-600">
                    Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
                </p>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">1. Données collectées</h2>
                    <p className="text-zinc-700">
                        Calendar Together collecte les informations suivantes lorsque vous
                        utilisez notre service :
                    </p>
                    <ul className="mt-2 list-inside list-disc text-zinc-700">
                        <li>Votre adresse e-mail (via connexion Google)</li>
                        <li>Votre nom et photo de profil Google</li>
                        <li>
                            Vos informations de disponibilité calendrier (créneaux
                            occupés/libres uniquement)
                        </li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">
                        2. Utilisation des données
                    </h2>
                    <p className="text-zinc-700">
                        Vos données sont utilisées uniquement pour :
                    </p>
                    <ul className="mt-2 list-inside list-disc text-zinc-700">
                        <li>Vous authentifier sur l&apos;application</li>
                        <li>
                            Afficher vos disponibilités aux membres des salles que vous
                            rejoignez
                        </li>
                        <li>Vous envoyer des invitations par e-mail si nécessaire</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">3. Partage des données</h2>
                    <p className="text-zinc-700">
                        Nous ne vendons ni ne partageons vos données personnelles avec des
                        tiers, sauf obligation légale.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">4. Sécurité</h2>
                    <p className="text-zinc-700">
                        Nous mettons en œuvre des mesures de sécurité appropriées pour
                        protéger vos informations personnelles.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">5. Contact</h2>
                    <p className="text-zinc-700">
                        Pour toute question concernant cette politique, contactez-nous à :{" "}
                        <a
                            href="mailto:contact@rrchs.fr"
                            className="text-blue-600 underline"
                        >
                            contact@rrchs.fr
                        </a>
                    </p>
                </section>
            </main>
        </div>
    );
}
