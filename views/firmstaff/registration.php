
<!DOCTYPE html>
<html lang="en">
<head>     

	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Registration || eLaw Lawyer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Cyber Impulses Software Solutions">
	
    <!-- Favicon -->    
    <link rel="shortcut icon" href="../superadminassets/img/favicon.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="../superadminassets/img/apple-icon.png">

	<!-- Bootstrap CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css">

	<!-- Tabler Icons CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">

	<!-- Simplebar CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/simplebar@6.3.2/dist/simplebar.min.css">

	<!-- Font Awesome v7.0.0 CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.0/css/fontawesome.min.css">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.0/css/all.min.css">

	<!-- Select2 CSS -->
	<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />

    <!-- Main CSS -->
    <link rel="stylesheet" href="../superadminassets/css/style.css">

</head>
<body>

    <!-- Begin Wrapper -->
    <div class="main-wrapper auth-bg position-relative overflow-hidden">

        <!-- Start Content -->
		<div class="container-fuild position-relative z-1">
			<div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">

				<!-- start row -->
				<div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap py-3">
					<div class="col-lg-9 mx-auto">
						<form action="login.php" class="d-flex justify-content-center align-items-center" method="POST">
							<div class="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
								<div class=" mx-auto mb-4 text-center">
								</div>
								<div class="card border-1 p-lg-3 shadow-md rounded-3 mb-4">
									<div class="card-body">
										<div class="text-center mb-3">
											<img src="../superadminassets/img/logo.png" class="img-fluid" alt="Logo" style="max-width: 12%;">
											<p class="mb-0">Please enter your details to create new lawyer account</p>
										</div>
										<div class="row">
											<div class="col-md-4">
												<div class="mb-3">
													<label for="lawyer_name" class="form-label">Lawyer Name</label>
													<div class="input-group">
														<span class="input-group-text border-end-0 bg-white">
															<i class="ti ti-user fs-14 text-dark"></i>
														</span>
                                            			<input type="text" id="lawyer_name" name="lawyer_name" class="form-control border-start-0 ps-0" placeholder="Adv. Test User" required>
													</div>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="license_number" class="form-label">License Number</label>
													<div class="input-group">
														<span class="input-group-text border-end-0 bg-white">
															<i class="ti ti-photo fs-14 text-dark"></i>
														</span>
														<input type="text" id="license_number" name="license_number" class="form-control border-start-0 ps-0"  placeholder="LAW/1234/2025" required>
													</div>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="email" class="form-label">Email</label>
													<div class="input-group">
														<span class="input-group-text border-end-0 bg-white">
															<i class="ti ti-mail fs-14 text-dark"></i>
														</span>
														<input type="email" id="email" name="email" class="form-control border-start-0 ps-0" placeholder="Enter Email Address" required>
													</div>
												</div>
											</div>
										</div>
										<div class="row">
											<div class="col-md-4">
												<div class="mb-3">
													<label for="kilvishcontact" class="form-label fw-bold">Phone Number</label>
													<div class="input-group kiltel-phone-wrap col-6">
														<button type="button" class="kiltel-country-trigger"></button>
														<input type="tel" class="form-control" name="full_contact" data-kilvish-tel  id="kilvishcontact" data-kilvish-preferred="JM,IN"  data-kiltel-init="JM" data-kiltel-validation="yes" required>
														<input type="hidden" id="country_code" name="country_code">
														<input type="hidden" id="contact" name="contact">
													</div>
													<div id="errorText1" style="color: red;"></div>
													<div id="kiltel-error" style="color:red; font-size:0.93em; margin-top:5px;"></div>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="password" class="form-label">Password</label>
													<div class="position-relative">
														<div class="pass-group input-group position-relative border rounded">
															<span class="input-group-text bg-white border-0">
																<i class="ti ti-lock text-dark fs-14"></i>
															</span>
															<input type="password" id="password" name="password" class="pass-input form-control ps-0 border-0" placeholder="****************" required>
															<span class="input-group-text bg-white border-0">
																<i class="ti toggle-password ti-eye-off text-dark fs-14"></i>
															</span>
														</div>
													</div>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="confirmpassword" class="form-label">Confirm Password</label>
													<div class="position-relative">
														<div class="pass-group input-group position-relative border rounded">
															<span class="input-group-text bg-white border-0">
																<i class="ti ti-lock text-dark fs-14"></i>
															</span>
															<input type="password" id="confirmpassword" name="confirmpassword" class="pass-inputs form-control ps-0 border-0" placeholder="****************" required>
															<span class="input-group-text bg-white border-0">
																<i class="ti toggle-passwords ti-eye-off text-dark fs-14"></i>
															</span>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div class="row">
											<div class="col-md-4">
												<label class="form-label">Select Practice Areas</label>
												<div class="dropdown w-100">
													<button class="form-control dropdown-toggle w-100" type="button" id="practiceDropdownButton" data-bs-toggle="dropdown" aria-expanded="false" style="text-align: left; white-space: normal; overflow: hidden; text-overflow: ellipsis;">
													Select Practice Areas
													</button>
													<ul class="dropdown-menu p-3" aria-labelledby="practiceDropdownButton" style="max-height: 250px; overflow-y: auto; width: 100%;">
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="criminal_law" id="practice_criminal" name="practice_areas[]">
															<label class="form-check-label" for="practice_criminal">Criminal Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="family_law" id="practice_family" name="practice_areas[]">
															<label class="form-check-label" for="practice_family">Family Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="corporate_law" id="practice_corporate" name="practice_areas[]">
															<label class="form-check-label" for="practice_corporate">Corporate Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="real_estate_law" id="practice_real_estate" name="practice_areas[]">
															<label class="form-check-label" for="practice_real_estate">Real Estate Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="tax_law" id="practice_tax" name="practice_areas[]">
															<label class="form-check-label" for="practice_tax">Tax Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="immigration_law" id="practice_immigration" name="practice_areas[]">
															<label class="form-check-label" for="practice_immigration">Immigration Law</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="intellectual_property" id="practice_ip" name="practice_areas[]">
															<label class="form-check-label" for="practice_ip">Intellectual Property</label>
															</div>
														</li>
														<li>
															<div class="form-check">
															<input class="form-check-input practice-check" type="checkbox" value="employment_law" id="practice_employment" name="practice_areas[]">
															<label class="form-check-label" for="practice_employment">Employment Law</label>
															</div>
														</li>
													</ul>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="bar_council" class="form-label mb-1 fw-medium">Bar Council Registered With<span class="text-danger ms-1">*</span></label>
                                            		<input type="text" id="bar_council" name="bar_council" class="form-control"  placeholder="Enter the bar council" required>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="experience" class="form-label mb-1 fw-medium">Years of Experience<span class="text-danger ms-1">*</span></label>
                                            		<input type="number" id="experience" name="experience" class="form-control" min="0" placeholder="Enter the experience" required>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="education" class="form-label mb-1 fw-medium">Highest Qualification<span class="text-danger ms-1">*</span></label>
													<input type="text" id="education" name="education" class="form-control" min="0" placeholder="LLB, LLM, etc." required>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
                                            		<label for="firm_logo" class="form-label">Lawyer Profile Picture</label>
													<div class="input-group">
														<div class="drag-upload-btn avatar avatar-xxl bg-light text-muted position-relative overflow-hidden z-1 mb-2 p-0">
															<i class="ti ti-user-plus fs-16"></i>
															<input type="file" id="firm_logo" name="firm_logo" class="form-control image-sign" multiple="">
															<div class="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
																<a href="javascript:void(0);" class="text-white d-flex align-items-center justify-content-center">
																	<i class="ti ti-photo fs-14"></i>
																</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div class="col-md-4">
												<div class="mb-3">
													<label for="government_id" class="form-label fw-bold">Upload Lawyer Certificate/Document</label>
													<div class="input-group">
														<div class="drag-upload-btn avatar avatar-xxl bg-light text-muted position-relative overflow-hidden z-1 mb-2 p-0">
															<i class="ti ti-user-plus fs-16"></i>
															<input type="file" id="firm_certificate" name="firm_certificate" class="form-control image-sign">
															<div class="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
																<a href="javascript:void(0);" class="text-white d-flex align-items-center justify-content-center">
																	<i class="ti ti-photo fs-14"></i>
																</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										
										<div class="row">
											<div class="col-md-12">
												<div class="mb-3">
													<label for="firm_address" class="form-label mb-1 fw-medium">Address<span class="text-danger ms-1">*</span></label>
													<textarea class="form-control" id="firm_address" name="firm_address" rows="3" placeholder="Enter address, city, zip"></textarea>
												</div>
											</div>
										</div>

										<div class="d-flex align-items-center justify-content-between mb-3">
											<div class="d-flex align-items-center">
												<div class="form-check form-check-md mb-0">
													<input class="form-check-input" id="remember_me" type="checkbox" required>
													<label for="remember_me" class="form-check-label mt-0 text-dark">I agree to the <a href="#" class="text-decoration-underline text-primary" data-bs-toggle="modal" data-bs-target="#termsModal"> Terms of Service</a> & <a href="#" class="text-decoration-underline text-primary" data-bs-toggle="modal" data-bs-target="#privacyModal">Privacy Policy </a></label>
												</div>
											</div>
										</div>
										<div class="mb-2">
											<div class="row">
												<div class="col-md-5"></div>
												<div class="col-md-2">
													<button type="submit" name="submit" id="submit" class="btn bg-primary text-white w-100">Sign Up</button>
												</div>
												<div class="col-md-5"></div>
											</div>
										</div>
										<div class="text-center">
											<h6 class="fw-normal fs-14 text-dark mb-0">Already have an account yet? 
												<a href="login.php" class="hover-a"> Login</a>
											</h6>
										</div>
									</div><!-- end card body -->
								</div><!-- end card -->
							</div>
						</form>
						<p class="text-dark text-center"> Copyright &copy; 2025 - <a href="#" class="text-info">eLaw</a>. All Rights Reserved | Design by <a href="https://myambergroup.com/" target="_blank" class="text-info">Amber Group</a></p>
					</div><!-- end col -->
				</div>
				<!-- end row -->

			</div>
		</div>
		<!-- End Content -->

        <!-- Start Bg Content -->

        <img src="../superadminassets/img/auth/auth-bg-top.png" alt="" class="img-fluid element-01">
        <img src="../superadminassets/img/auth/auth-bg-bot.png" alt="" class="img-fluid element-02">
        <!-- End Bg Content -->

    </div>
    <!-- End Wrapper -->

<!-- jQuery -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- Bootstrap Core JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>  

<!-- Main JS -->
<script src="../superadminassets/js/script.js"></script>

<!-- Select2 JS -->
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

<!-- Kiltel Phone Input -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kiltel@1.0.58/kiltel.min.css">
<script src="https://cdn.jsdelivr.net/npm/kiltel@1.0.58/kiltel.min.js"></script>
<!-- Kiltel Phone Input -->

<script>
  // ✅ JS to update button text based on selected practice areas
  const practiceCheckboxes = document.querySelectorAll('.practice-check');
  const practiceDropdownButton = document.getElementById('practiceDropdownButton');

  practiceCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = [...practiceCheckboxes].filter(c => c.checked).map(c => c.nextElementSibling.innerText);
      practiceDropdownButton.innerText = selected.length > 0 ? selected.join(', ') : 'Select Practice Areas';
    });
  });
</script>

<script>
    $(document).ready(function() {
        $('#business_type').select2({
            placeholder: "Select any one",
            allowClear: true,
            width: '100%' // This is important to make it fit inside Bootstrap column
        });
    });
</script>

<!-- Terms of Service Modal -->
<div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title" id="termsModalLabel">Terms of Service</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vehicula magna in ipsum bibendum tincidunt.</p>
        <p>These are your terms. Replace this text with your actual policy.</p>
      </div>

    </div>
  </div>
</div>
<!-- Terms of Service Modal -->

<!-- Privacy Policy Modal -->
<div class="modal fade" id="privacyModal" tabindex="-1" aria-labelledby="privacyModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title" id="privacyModalLabel">Privacy Policy</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <p>This is the privacy policy section. You can update this with your real content.</p>
        <p>Your privacy matters. We never share your data without your consent.</p>
      </div>

    </div>
  </div>
</div>
<!-- Privacy Policy Modal -->
 
</body>
</html>