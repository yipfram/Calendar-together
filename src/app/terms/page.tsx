export default function TermsOfServicePage() {
    return (
        <div className="flex min-h-screen flex-col bg-white px-6 py-12 font-sans text-zinc-900">
            <main className="mx-auto w-full max-w-2xl">
                <h1 className="mb-6 text-3xl font-bold">Conditions d&apos;utilisation</h1>

                <p className="mb-4 text-zinc-600">
                    Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
                </p>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">1. Acceptation</h2>
                    <p className="text-zinc-700">
                        En utilisant Calendar Together, vous acceptez les présentes
                        conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions,
                        veuillez ne pas utiliser le service.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">
                        2. Description du service
                    </h2>
                    <p className="text-zinc-700">
                        Calendar Together est une application permettant de trouver des
                        créneaux communs entre plusieurs personnes en consultant leurs
                        disponibilités calendrier.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">
                        3. Compte utilisateur
                    </h2>
                    <p className="text-zinc-700">
                        Vous êtes responsable de maintenir la confidentialité de votre
                        compte. Vous acceptez de nous informer immédiatement de toute
                        utilisation non autorisée.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">
                        4. Utilisation acceptable
                    </h2>
                    <p className="text-zinc-700">Vous vous engagez à :</p>
                    <ul className="mt-2 list-inside list-disc text-zinc-700">
                        <li>Ne pas utiliser le service à des fins illégales</li>
                        <li>Ne pas tenter de compromettre la sécurité du service</li>
                        <li>Respecter les autres utilisateurs</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">
                        5. Limitation de responsabilité
                    </h2>
                    <p className="text-zinc-700">
                        Calendar Together est fourni &quot;tel quel&quot;. Nous ne garantissons pas
                        que le service sera ininterrompu ou exempt d&apos;erreurs.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">6. Modifications</h2>
                    <p className="text-zinc-700">
                        Nous nous réservons le droit de modifier ces conditions à tout
                        moment. Les modifications entreront en vigueur dès leur publication.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold">7. Contact</h2>
                    <p className="text-zinc-700">
                        Pour toute question, contactez-nous à :{" "}
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
