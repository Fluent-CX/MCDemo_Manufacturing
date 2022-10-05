SalesforceInteractions.init({
    cookieDomain: "mc2xsctbllc5pw-0ck06pnh5c6g8.pub.sfmc-content.com"
}).then(() => {

    const config = {
        global: {
            contentZones: [
                { name: "defaultContentZone", selector: "#mcp-contentZone" }
            ],
            listeners: [
                SalesforceInteractions.listener("submit", ".mcp-whitepaper_download", () => {
                    const email = SalesforceInteractions.cashDom("input[name=email]").val();
                    const lastName = SalesforceInteractions.cashDom("input[name=Last_Name]").val();
                    console.log("listener2");
                    if (email) {
                        SalesforceInteractions.sendEvent({ 
                            interaction: { 
                                name: "Whitepaper Download" 
                            }, 
                            user: { 
                                identities: { 
                                    emailAddress: email 
                                },
                                attributes: {
                                    lastName: lastName
                                }
                            }                            
                        });
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
                name: "Home",
                isMatch: () => document.querySelector('meta[name="mcp-pageName"]').content === 'Homepage',
                interaction: {
                    name: "Home",
                },    
                contentZones: [
                    { name: "hero_banner", selector: ".mcp-hero_banner" }
                ]
            },
            {
                name: "Product Detail",
                isMatch: () => document.querySelector('meta[name="mcp-pageName"]').content === 'Product Detail',
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
                        id: () => SalesforceInteractions.resolvers.fromMeta("mcp-articleId"),
                        attributes: {
                            name: () => SalesforceInteractions.resolvers.fromMeta("mcp-articleName"),
                            url: SalesforceInteractions.resolvers.fromCanonical(),
                            description: () => SalesforceInteractions.resolvers.fromMeta("mcp-articleDescription"),
                        },
                        relatedCatalogObjects: { 
                            Category: [SalesforceInteractions.resolvers.fromMeta("mcp-articleCategory")],
                            itemClass: [SalesforceInteractions.resolvers.fromMeta("mcp-articleSubject")]
                        }
                    }
                },
                contentZones: [
                    { name: "products_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "Case Study",
                isMatch: () => document.querySelector('meta[name="mcp-pageName"]').content === 'Case Studies Overview',
                interaction: {
                    name: "Case Study",
                },    
                contentZones: [
                ]
            },
        ]
    }
    SalesforceInteractions.initSitemap(config);
});