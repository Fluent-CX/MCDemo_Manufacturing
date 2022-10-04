SalesforceInteractions.init({
    cookieDomain: "mc2xsctbllc5pw-0ck06pnh5c6g8.pub.sfmc-content.com",
    consents: [{
        purpose: SalesforceInteractions.mcis.ConsentPurpose.Personalization,
        provider: "fluent:cx Demo",
        status: SalesforceInteractions.ConsentStatus.OptIn
    }]
}).then(() => {

    const config = {
        global: {
            contentZones: [
                { name: "global_popup" },
                { name: "global_infobar" },
                { name: "global_exit_intent"},
                /*
                Since the website does not have consistent selectors and structure within the Article pages,
                this content zone will be used to add recs to the bottom of Article pages.
                */
                { name: "global_footer", selector: "footer.global-footer" }
            ],
            listeners: [
                /*
                Here we are listening for all submission events that happen within this document. This pattern
                can be used to create generic form submission event handlers, or even just to consolidate them
                to one place in the sitemap code.
                */
                SalesforceInteractions.listener("submit", "body", (event) => {
                    // Check the id of the event target to check for the login form we want to scrape data from
                    if (event.target.id === "login-form") {
                        // loop through login form fields...
                        for (i = 0; i < event.target.length; i++) {
                            // Find the email field by id within the event object.
                            if (event.target[i].id === "login-email") {
                                // save user email in session storage
                                sessionStorage.setItem('islogin', event.target[i].value);
                            }
                        }
                    }
                }),
            ],
        },
        pageTypeDefault: {
            name: "default",
            interaction: {
                name: "Default Page"
            }
        },
        pageTypes: [
            {
                name: "home",
                isMatch: () => /^\/$/.test(window.location.pathname),
                interaction: {
                    name: "Homepage",
                },    
                contentZones: [
                    { name: "home_recs_1", selector: "section.datalocation-audience-segment-links" },
                    { name: "home_recs_2", selector: "section.datalocation-customer-stories" },
                ]
            },
            {
                name: "products_landing",
                isMatch: () => /^\/products\/?$/.test(window.location.pathname),
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        /*
                        Remember, Catalog IDs are case sensitive. Transforming collected values as all upper case or all lower 
                        case is a common method for ensuring consistency throughout the site when creating Catalog IDs with the
                        sitemap which do not need to correspond to data in external systems.
                        */
                        type: "Category",
                        id: () => SalesforceInteractions.mcis.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        attributes: {    
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            name: SalesforceInteractions.resolvers.fromMeta("og:title")
                        }
                    }
                },
                contentZones: [
                    { name: "products_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "solutions_landing",
                isMatch: () => /^\/solutions\/?(customers|industries|departments|technologies)?$/.test(window.location.pathname),
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        /* 
                        The last parameter of each resolver function accepts a function which returns whatever the desired final value is.
                        This is very useful when you need to transform or sanitize a scraped value before sending it to Interaction studio. 

                        You can learn more about resolver functions here: https://developer.evergage.com/web-integration/sitemap/sitemap-implementation-notes#resolvers
                        
                        Below, the pathname portion of the URL is transformed into a hierarchal Category id.
                        */
                        type: "Category",
                        id: SalesforceInteractions.resolvers.fromWindow("location.pathname", (path) => path.split('/').slice(1).join('|').toLowerCase()),
                        attributes: {
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            name: SalesforceInteractions.resolvers.fromMeta("og:title")
                        }
                    }
                },
                contentZones: [
                    { name: "solutions_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "learning_landing",
                isMatch: () => /^\/learn\/?$/.test(window.location.pathname),
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        type: "Category",
                        id: () => SalesforceInteractions.mcis.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        attributes: {
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            name: SalesforceInteractions.resolvers.fromMeta("og:title")
                        }
                    }
                },
                contentZones: [
                    { name: "learning_landing_gray_recs", selector: ".entity-paragraphs-item.paragraph--type--cross-reference" },
                    { name: "learning_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "blog_landing",
                isMatch: () => /^\/about\/blog\/?$/.test(window.location.pathname),
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        type: "Category",
                        id: () => SalesforceInteractions.mcis.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        attributes: {
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            name: SalesforceInteractions.resolvers.fromMeta("og:title")
                        }
                    }
                },
                contentZones: [
                    { name: "blog_landing_card_wall", selector: ".card-wall" },
                    { name: "blog_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "product",
                action: "Product",
                isMatch: () => {
                    if (/^\/products\//.test(window.location.pathname)) {
                        /* 
                        We only want to call setPageDetailsFromDataLayer() when pages which rely on scraping information from the dataLayer are actually matched.
                        Adding a conditional statement prevents this function from being called on every page on the site as Interaction Studio resolves every
                        isMatch function to see which page type matches the current one.
                        */
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        /*
                        Remember, while this site does promote products, there is no ability to purchase products or attribute
                        revenue to them from other channels which would match with user activity from the web.
                        Since the special capabilities of the Product item type will not be needed for this implementation,
                        we will instead use the Article item type, utilizing Category to tell types of Article apart.
                        */
                        type: "Article",
                        /*
                        We are using SalesforceInteractions.mcis.getValueFromNestedObject() to more easily reference data from the pageDetails
                        object after the value is set when the page matches.
                        */
                        id: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityId", pageDetails),
                        attributes: {
                            name: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityLabel", pageDetails),
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            imageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src")
                        },
                        relatedCatalogObjects: { 
                            Category: SalesforceInteractions.resolvers.fromWindow("location.pathname", (path) => {
                                const categories = path.split('/').slice(1);
                                categories.pop();
                                if (categories.length === 0) {
                                    const dataLayerCategories = SalesforceInteractions.mcis.getValueFromNestedObject("page.category1", pageDetails);
                                    return dataLayerCategories ? [dataLayerCategories.toLowerCase()] : [];
                                } 
                                return [categories.join('|').toLowerCase()];
                            }),
                            ProductType: () => window.location.pathname.indexOf("add-ons") > -1 ? ["Add-On"] : ["Software"],
                            Industry: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = SalesforceInteractions.mcis.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            },
                            Keyword: SalesforceInteractions.resolvers.fromMeta("keywords", (ele) => {
                                return ele ? ele.split(/\,\s*/) : null;
                            })
                        }
                    }
                },
                listeners: [
                    SalesforceInteractions.listener("submit", "#webform-submission-email-embeddable-1-add-form", (event) => {
                        SalesforceInteractions.sendEvent({
                            interaction: {name: "Free Trial Download"},
                            /*
                            A content zone is provided in this event in order to allow a campaign targeting the "global_infobar"
                            content zone to be returned in the response sent back from Interaction Studio with this request.
                            */
                            source:{
                                contentZones: ["global_infobar"]
                            }
                        });
                    })
                ]
            },
            {
                name: "solutions",
                isMatch: () => {
                    if (/\/solutions\/(?!customers|industries|departments|technologies)/.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        type: "Article",
                        id: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityId", pageDetails),
                        attributes: {
                            name: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityLabel", pageDetails),
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            imageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src")
                        },
                      relatedCatalogObjects: {
                            Category: SalesforceInteractions.resolvers.fromWindow("location.pathname", (path) => {
                                const categories = path.split('/').slice(1);
                                categories.pop();
                                return [categories.join('|').toLowerCase()];
                            }),
                            Industry: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = SalesforceInteractions.mcis.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            }
                        },
                    }
                }
            },
            {
                name: "learning",
                isMatch: () => {
                    if (/^\/learn\//.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        type: "Article",
                        id: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityId", pageDetails),
                        attributes: {
                            name: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityLabel", pageDetails),
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            imageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src")
                        },
                      relatedCatalogObjects: {
                            Category: SalesforceInteractions.resolvers.fromWindow("location.pathname", (path) => {
                                const categories = path.split('/').slice(1);
                                categories.pop();
                                return [categories.join('|').toLowerCase()];
                            }),
                            Industry: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (SalesforceInteractions.mcis.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = SalesforceInteractions.mcis.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            }
                        }
                    }
                }
            },
            {
                name: "blog",
                isMatch: () => {
                    if (/\/about\/blog\/\d+\/\d+\/.+/.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                interaction: {
                    name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                    catalogObject: {
                        type: "Blog",
                        id: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityId", pageDetails),
                        attributes: {
                            name: () => SalesforceInteractions.mcis.getValueFromNestedObject("entityLabel", pageDetails),
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            imageUrl: SalesforceInteractions.resolvers.fromMeta("og:image")
                        },
                        relatedCatalogObjects: {
                            Category: () => [SalesforceInteractions.mcis.getValueFromNestedObject("flatTaxonomy.blog_categories", pageDetails)]
                        }
                    }
                },
                listeners: [
                    SalesforceInteractions.listener("submit", ".premium-access-ajax", () => {
                        const eloquaId = findInDataLayer("EloquaGuid");
                        if (eloquaId) {
                            SalesforceInteractions.sendEvent({interaction: {name: "Tableau Blog Sign-up"}, user: {attributes: {eloquaId: eloquaId}}});
                        }
                    }),
                ],
                contentZones: [
                    /*
                    As in this case below, content zones do not necessarily have to denote content to be replaced, they can be
                    useful for inserting template content before or after the the DOM node with the provided selector.
                    */
                    { name: "blog_text_content", selector: ".field--name-field-page-sections" }
                ]
            }
        ]
    }
    SalesforceInteractions.initSitemap(config);
});