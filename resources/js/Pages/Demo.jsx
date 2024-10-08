// import React from 'react';
// import { TitleBar, ResourcePicker } from '@shopify/app-bridge-react';


// class DefaultTitleBar extends React.Component {
// 	state = { 
// 		productPickerOpen: false 
// 	};
	
// 	constructor(props) {
// 		super(props);
// 	}

// 	openProductPicker = () => {
// 		this.setState({ productPickerOpen: true });
// 	}

// 	closeProductPicker = () => {
// 		this.setState({ productPickerOpen: false });
// 	}

// 	render() {
// 		const primaryAction = this.props.primaryAction || {
// 			content: 'Select product',
// 			onAction: this.openProductPicker,
// 		};

// 		return (
// 			<React.Fragment>
// 				<TitleBar
// 					title={this.props.title}
// 					primaryAction={primaryAction}
// 					breadcrumbs={this.props.breadcrumbs}
// 				/>
// 				<ResourcePicker
// 					resourceType="Product"
// 					actionVerb="select"
// 					showVariants={false}
// 					selectMultiple={true}
// 					open={this.state.productPickerOpen}
// 					onSelection={this.handleSelection}
// 					onCancel={this.closeProductPicker}
// 				/>
// 			</React.Fragment>
// 		);
// 	}
	
// 	handleSelection = (resources) => {
// 		console.log(resources); 
// 	}
// }

// export default DefaultTitleBar;


// import React, { useEffect, useState, useCallback } from 'react';
// import { Select, TextField, Checkbox, Thumbnail, IndexTable, Modal, Spinner, Text } from '@shopify/polaris';
// import createApp from '@shopify/app-bridge';
// import { getSessionToken } from "@shopify/app-bridge-utils";
// import '../../../public/css/style.css';
// const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
// const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;
// import axios from 'axios';


// const RateModifiersComponent = (props) => {
//     const [rateModifiers, setRateModifiers] = useState([]);
//     const [selectedProductIds, setSelectedProductIds] = useState([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const rateModifiersOptions = []; // Assume this is defined elsewhere
// 	const [productsForRateModifer, setProductsForRateModifer] = useState([])
// 	const fetchProductsForRate = async (cursor, direction) => {
//         try {
       
//             const app = createApp({
//                 apiKey: SHOPIFY_API_KEY,
//                 host: props.host,
//             });
//             const token = await getSessionToken(app);

          
//             const response = await axios.post(`${apiCommonURL}/api/products`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });

//             const productData = response.data;
//             setProductsForRateModifer(productData.products)
//             console.log(productData)

//         } catch (error) {
    
         
//             console.error('Error fetching product data:', error);
//         }
//     };

//     const handleAddRateModifier = () => {
//         const newId = rateModifiers.length ? rateModifiers[rateModifiers.length - 1].id + 1 : 1;
//         const defaultRateModifier = 'dayOfOrder';
//         const defaultOption = rateModifiersOptions.find(option => option.value === defaultRateModifier);

//         setRateModifiers((prevModifiers) => [
//             ...prevModifiers,
//             {
//                 id: newId,
//                 name: '',
//                 title: '',
//                 rateModifier: defaultRateModifier,
//                 rateModifier2: defaultRateModifier,
//                 label1: defaultOption?.mainlabel || '',
//                 label2: defaultOption?.mainlabel || '',
//                 rateOperator: 'equal',
//                 rateOperator2: 'equal',
//                 rateDay: '',
//                 rateDay2: '',
//                 type: 'None',
//                 behaviour: 'Stack',
//                 modifierType: 'Fixed',
//                 adjustment: '',
//                 effect: 'Decrease',
//                 productData1: [],
//                 productData2: []
//             }
//         ]);

//         setOpen((prevState) => ({
//             ...prevState,
//             [newId]: true,
//         }));
//     };

// useEffect(() =>{
// 	fetchProductsForRate()

// },[])


//     const handleRateModifierChange = (id, field) => (value) => {
//         const option = rateModifiersOptions.find(opt => opt.value === value);

//         setRateModifiers((prevModifiers) =>
//             prevModifiers.map((modifier) => {
//                 if (modifier.id === id) {
//                     const newModifier = {
//                         ...modifier,
//                         [field]: value,
//                         ...(field === 'rateModifier' && {
//                             label1: option?.mainlabel || '',
//                             unit: value === 'weight' ? shop_weight_unit : '',
//                             rateDay: '',
//                             rateOperator: value === 'availableQuan'
//                                 ? 'lthenoequal'
//                                 : (value === 'title' || value === 'address' ? 'contains' : option?.mainlabel || ''),
//                         }),
//                         ...(field === 'rateModifier2' && {
//                             label2: option?.mainlabel || '',
//                             unit2: value === 'weight' ? shop_weight_unit : '',
//                             rateDay2: '',
//                             rateOperator2: value === 'availableQuan'
//                                 ? 'lthenoequal'
//                                 : (value === 'title' || value === 'address' ? 'contains' : option?.mainlabel || ''),
//                         }),
//                     };

//                     // Update corresponding product data based on modifier state
//                     newModifier.productData1 = (newModifier.rateModifier === 'ids') ? selectedProductIds : [];
//                     newModifier.productData2 = (newModifier.rateModifier2 === 'ids') ? selectedProductIds : [];

//                     return newModifier;
//                 }
//                 return modifier;
//             })
//         );
//     };

//     const handleCheckboxChange2 = (id, modifierId) => {
//         setRateModifiers((prevModifiers) =>
//             prevModifiers.map((modifier) => {
//                 if (modifier.id === modifierId) {
//                     const updatedProductData = modifier.rateModifier === 'ids'
//                         ? modifier.productData1.includes(id)
//                             ? modifier.productData1.filter((productId) => productId !== id)
//                             : [...modifier.productData1, id]
//                         : modifier.productData2.includes(id)
//                             ? modifier.productData2.filter((productId) => productId !== id)
//                             : [...modifier.productData2, id];

//                     return {
//                         ...modifier,
//                         productData1: modifier.rateModifier === 'ids' ? updatedProductData : modifier.productData1,
//                         productData2: modifier.rateModifier2 === 'ids' ? updatedProductData : modifier.productData2,
//                     };
//                 }
//                 return modifier;
//             })
//         );
//     };



// 	const handleModalClose = useCallback(() => {
//         setIsModalOpen(false);
//     }, []);
//     useEffect(() => {
//         if (rateModifiers.length === 0) return;

//         const selectedProducts = productsForRateModifer.filter(product => selectedProductIds.includes(product.id));

//         setRateModifiers((prevModifiers) => {
//             const lastModifierIndex = prevModifiers.length - 1;
//             if (lastModifierIndex < 0) return prevModifiers;

//             const updatedModifiers = [...prevModifiers];
//             updatedModifiers[lastModifierIndex] = {
//                 ...updatedModifiers[lastModifierIndex],
//                 productData1: selectedProducts.map(({ id, title, price }) => ({
//                     id,
//                     title,
//                     price,
//                 })),
//                 productData2: selectedProducts.map(({ id, title, price }) => ({
//                     id,
//                     title,
//                     price,
//                 })),
//             };

//             return updatedModifiers;
//         });
//     }, [selectedProductIds, productsForRateModifer]);

//     const productData2 = productsForRateModifer?.map(({ id, title, image, price }, index) => (
//         <IndexTable.Row id={id} key={id} position={index}>
//             <IndexTable.Cell>
//                 <Checkbox
//                     checked={selectedProductIds.includes(id)}
//                     onChange={() => handleCheckboxChange2(id, modifier.id)}
//                 />
//             </IndexTable.Cell>
//             <IndexTable.Cell>
//                 <Thumbnail source={image} size="small" alt={title} />
//             </IndexTable.Cell>
//             <IndexTable.Cell>
//                 <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
//                     <Text fontWeight="bold" as="span">{title}</Text>
//                 </div>
//             </IndexTable.Cell>
//             <IndexTable.Cell>
//                 <Text fontWeight="bold" as="span">{price}</Text>
//             </IndexTable.Cell>
//         </IndexTable.Row>
//     ));

//     return (
//         <>
//             {rateModifiers.map((modifier) => (
//                 <div key={modifier.id}>
//                     <Select
//                         label="Apply this rate modifier when"
//                         options={rateModifiersOptions}
//                         value={modifier.rateModifier}
//                         onChange={handleRateModifierChange(modifier.id, 'rateModifier')}
//                     />
//                     {modifier.rateModifier === 'ids' && (
//                         <TextField
//                             type='text'
//                             value={modifier.productData1.join(', ')}  // Display selected IDs
//                             onChange={handleRateModifierChange(modifier.id, 'productData1')}
//                             multiline={4}
//                             onFocus={() => handleFocus(modifier.id)}
//                             helpText='Add product IDs with comma(,) separator'
//                         />
//                     )}
//                     <Select
//                         label="Apply this rate modifier when"
//                         options={rateModifiersOptions}
//                         value={modifier.rateModifier2}
//                         onChange={handleRateModifierChange(modifier.id, 'rateModifier2')}
//                     />
//                     {modifier.rateModifier2 === 'ids' && (
//                         <TextField
//                             type='text'
//                             value={modifier.productData2.join(', ')}  // Display selected IDs
//                             onChange={handleRateModifierChange(modifier.id, 'productData2')}
//                             multiline={4}
//                             onFocus={() => handleFocus(modifier.id)}
//                             helpText='Add product IDs with comma(,) separator'
//                         />
//                     )}
//                 </div>
//             ))}
//             <Modal
//                 open={isModalOpen}
//                 onClose={handleModalClose}
//                 title="My Shopify Modal"
//                 primaryAction={{
//                     content: 'Add',
//                     onAction: handleModalClose,
//                     disabled: selectedProductIds.length === 0,
//                 }}
//                 secondaryActions={[
//                     {
//                         content: 'Cancel',
//                         onAction: handleModalClose,
//                     },
//                 ]}
//             >
//                 <Modal.Section>
//                     <div style={{ position: 'relative' }}>
//                         <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
//                             <TextField
//                                 placeholder='search'
//                                 // onChange={handlesearchChange}
//                                 // value={value}
//                                 type="text"
//                                 // prefix={<Icon source={SearchIcon} color="inkLighter" />}
//                                 autoComplete="off"
//                                 clearButton
//                                 // onClearButtonClick={handleClearButtonClick}
//                             />
//                         </div>
//                         <div style={{ marginTop: '4%', height: '400px', overflowY: 'scroll' }}>
//                             <IndexTable
//                                 // resourceName={resourceName}
//                                 itemCount={productsForRateModifer.length}
//                                 headings={[
//                                     { title: `Selecte` },
//                                     { title: 'Image' },
//                                     { title: 'Title' },
//                                     { title: 'Price' },
//                                 ]}
//                                 selectable={false}
//                                 // pagination={{
//                                 //     hasNext: pageInfo.hasNextPage,
//                                 //     onNext: handleNextPageRate,
//                                 //     hasPrevious: pageInfo.hasPreviousPage,
//                                 //     onPrevious: handlePreviousPageRate,
//                                 // }}
//                             >
                               
//                                     productData2
                             
//                             </IndexTable>
//                         </div>
//                     </div>
//                 </Modal.Section>
//             </Modal>
//         </>
//     );
// };

// export default RateModifiersComponent;



{/* <div style={{ marginTop: '2%' }}>
<Grid>
  <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
    <div style={{ marginTop: '5%' }}>
      <Text variant="headingMd" as="h6">Mix/Merge Rate Setting</Text>
    </div>
    <div style={{ marginTop: '4%' }}>
      <List>
        <List.Item>
          When product rate set combine it with all product rates & additive with normal rate.
        </List.Item>
      </List>
    </div>
  </Grid.Cell>
  <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
    <LegacyCard sectioned>
      <div style={{ marginBottom: "2%", marginLeft: "83%" }}>
        <Button variant='primary' onClick={handleAddMixMergeRate}  >Merge Rates</Button>
      </div>
      <Banner tone="warning">
        <p>
          If the first option of mix/merge rate setting is Yes (Automatic), the merge rate will not work.
        </p>
      </Banner>
      <div style={{ marginTop: "3%" }}>
        <Text variant="headingXs" as="h6">
          Do you want to combine all product/tag/SKU/type/vendor shipping rates into one rate?
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10%', marginTop: "2%" }}>
          <RadioButton
            label="Yes (Automatic)"
            checked={settings.mix_merge_rate === 0}
            id="yes"
            name="mix_merge_rate"
            onChange={() => handleCheckedChange('mix_merge_rate', 0)}
          />
          <RadioButton
            label="No (Manually - Using merge rate)"
            checked={settings.mix_merge_rate === 1}
            id="No"
            name="mix_merge_rate"
            onChange={() => handleCheckedChange('mix_merge_rate', 1)}
          />
        </div>
        {settings.mix_merge_rate !== 1 && (
          <div style={{ marginTop: '3%' }}>
            <p>
              Applicable only if you set shipping rates based on product. If the cart contains some products with rate and some items without rate then a default rate like weight-based will come along with product-based rate.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10%', marginTop: "2%" }}>
              <RadioButton
                label="Yes"
                checked={settings.mix_merge_rate_1 === 0}
                id="yesMix"
                name="mix_merge_rate_1"
                onChange={() => handleCheckedChange('mix_merge_rate_1', 0)}
              />
              <RadioButton
                label="No"
                checked={settings.mix_merge_rate_1 === 1}
                id="NoMix"
                name="mix_merge_rate_1"
                onChange={() => handleCheckedChange('mix_merge_rate_1', 1)}
              />
            </div>
            {settings.mix_merge_rate_1 !== 1 && (
              <div style={{ marginTop: "3%" }}>
                <FormLayout>
                  <TextField
                    label="Additional Description of Mix Rate"
                    placeholder='Included with product base rate'
                    value={settings.additional_description_of_mix_rate}
                    onChange={handleInputChange('additional_description_of_mix_rate')}

                  />
                  <TextField
                    label="Maximum Price of Auto Product Base Mix Rate"
                    value={settings.max_price_of_auto_product_base_mix_rate}
                    onChange={handleInputChange('max_price_of_auto_product_base_mix_rate')}
                    type="number"
                    placeholder='0.00'
                  />
                </FormLayout>
              </div>
            )}
          </div>
        )}
      </div>
    </LegacyCard>
  </Grid.Cell>
</Grid>
</div> */}


import React from 'react'

function Demo() {
  return (
	<div>Demo</div>
  )
}

export default Demo